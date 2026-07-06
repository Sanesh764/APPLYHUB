const cron = require("node-cron");
const Job = require("../models/Job");
const jobAggregator = require("./jobAggregator.service");
const cacheService = require("./cache.service");
const logger = require("../config/logger");

/**
 * -----------------------------------------------------------------------------
 * Cron Service — Live Job Cache Refresh
 * -----------------------------------------------------------------------------
 * NOTE: The former "Auto-Apply" automation (runDailyAutomation / daily digest)
 * has been REMOVED. ApplyHub never auto-submits applications. This service now
 * exists purely to keep the Mongo job cache warm and prune stale listings.
 *
 * Every ~45 minutes it re-runs a set of popular default queries through the
 * aggregator (which upserts fresh results into the Job cache) and deletes jobs
 * that have not been seen in a fetch for a while.
 */

// Popular default searches used to keep the cache warm for first-load / browse.
const WARM_QUERIES = [
  "software engineer",
  "frontend developer",
  "backend developer",
  "full stack developer",
  "data scientist",
  "devops engineer",
  "product manager",
];

// Jobs not re-seen by a fetch within this window are pruned.
const STALE_AFTER_DAYS = 21;

class CronService {
  constructor() {
    this.jobs = {};
  }

  /** Initialize and start scheduled tasks. */
  init() {
    logger.info("Cron Service: Initializing background cache-refresh jobs...");

    // Refresh the job cache every 45 minutes (spec: 30–60 min).
    this.jobs.cacheRefresh = cron.schedule("*/45 * * * *", async () => {
      logger.info("Cron Service: Executing scheduled job cache refresh...");
      try {
        await this.refreshJobCache();
      } catch (err) {
        logger.error("Cron Service: Cache refresh task failed", err);
      }
    });

    logger.info("Cron Service: 45-minute job cache-refresh scheduled successfully.");
  }

  /**
   * Re-run the warm queries through the aggregator to refresh cached listings,
   * then prune stale jobs. Safe to trigger manually for verification.
   */
  async refreshJobCache() {
    logger.info("Cron Service: Refreshing job cache from providers...");
    let upserted = 0;

    for (const query of WARM_QUERIES) {
      try {
        const enriched = await jobAggregator.search(query, {});
        for (const job of enriched) {
          try {
            await Job.findOneAndUpdate(
              { source: job.source, externalId: job.externalId },
              {
                $set: {
                  ...this.stripAiFields(job),
                  lastFetchedAt: new Date(),
                },
              },
              { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
            );
            upserted += 1;
          } catch (err) {
            logger.warn(`Cron Service: upsert failed for "${job.title}": ${err.message}`);
          }
        }
      } catch (err) {
        logger.error(`Cron Service: warm query "${query}" failed: ${err.message}`);
      }
    }

    // Invalidate in-memory search cache so the next request sees fresh data.
    cacheService.clear();

    const pruned = await this.pruneStaleJobs();
    logger.info(`Cron Service: Cache refresh complete. Upserted ~${upserted} jobs, pruned ${pruned} stale.`);
    return { upserted, pruned };
  }

  /** Delete jobs whose last successful fetch is older than the stale window. */
  async pruneStaleJobs() {
    const cutoff = new Date(Date.now() - STALE_AFTER_DAYS * 24 * 60 * 60 * 1000);
    const result = await Job.deleteMany({ lastFetchedAt: { $lt: cutoff } });
    return result.deletedCount || 0;
  }

  /** AI-owned fields are preserved across refresh; never overwrite them here. */
  stripAiFields(job) {
    const { summary, preferredSkills, ...rest } = job;
    return rest;
  }
}

module.exports = new CronService();
