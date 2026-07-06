const { providers, allProviders } = require("./providers");
const enrichmentService = require("./jobEnrichment.service");
const logger = require("../config/logger");

/**
 * -----------------------------------------------------------------------------
 * Job Aggregator Service
 * -----------------------------------------------------------------------------
 * Fans out a search across every enabled provider, normalizes + deterministically
 * enriches each result, removes duplicates across sources, applies filters, and
 * ranks by relevance. Provider failures are isolated — one dead source never
 * breaks the aggregate.
 */
class JobAggregatorService {
  /**
   * @param {string} query
   * @param {Object} filters  { location, company, remoteType, employmentType,
   *   experience, salary, skills(csv|array), postedWithin(days) }
   * @returns {Promise<Array<Object>>} enriched, deduped, filtered, ranked jobs
   */
  async search(query = "", filters = {}) {
    const start = Date.now();
    logger.info(
      `Aggregator: searching "${query || "*"}" across [${providers.map((p) => p.name).join(", ")}]`
    );

    // 1. Parallel fan-out — allSettled so a rejection can never bubble up.
    const settled = await Promise.allSettled(
      providers.map((provider) => provider.searchJobs(query, filters))
    );

    const rawJobs = [];
    settled.forEach((result, i) => {
      const provider = providers[i];
      if (result.status === "fulfilled" && Array.isArray(result.value)) {
        rawJobs.push(...result.value);
      } else {
        const reason = result.status === "rejected" ? result.reason?.message : "non-array result";
        logger.error(`Aggregator: provider "${provider.name}" failed — ${reason}`);
      }
    });

    // 2. Deterministic enrichment (fast, per-job)
    const enriched = rawJobs
      .map((raw) => {
        try {
          return enrichmentService.enrich(raw);
        } catch (err) {
          logger.warn(`Aggregator: enrichment failed for "${raw.title}" — ${err.message}`);
          return null;
        }
      })
      .filter(Boolean);

    // 3. Duplicate detection across providers (keep newest)
    const deduped = this.deduplicate(enriched);

    // 4. Filters
    const filtered = this.applyFilters(deduped, filters);

    // 5. Rank by relevance
    const ranked = this.rank(filtered, query);

    logger.info(
      `Aggregator: fetched ${rawJobs.length} → deduped ${deduped.length} → filtered ${filtered.length} in ${Date.now() - start}ms`
    );
    return ranked;
  }

  /**
   * Build a composite identity key and drop duplicates, preferring the most
   * recently posted copy. Two jobs collide if they share the same normalized
   * apply URL, OR the same normalized (title + company + location) triple.
   */
  deduplicate(jobs) {
    const byKey = new Map();

    for (const job of jobs) {
      const keys = this.dedupKeys(job);
      // Find an existing bucket any of this job's keys already map to.
      let existingKey = keys.find((k) => byKey.has(k));

      if (!existingKey) {
        // New job — register all its keys pointing at it.
        for (const k of keys) byKey.set(k, job);
        continue;
      }

      const incumbent = byKey.get(existingKey);
      const keepIncoming = new Date(job.postedAt) > new Date(incumbent.postedAt);
      if (keepIncoming) {
        // Replace incumbent everywhere and register the incoming job's keys too.
        for (const [k, v] of byKey.entries()) {
          if (v === incumbent) byKey.set(k, job);
        }
        for (const k of keys) byKey.set(k, job);
      }
    }

    return Array.from(new Set(byKey.values()));
  }

  dedupKeys(job) {
    const keys = [];
    const norm = (s) => (s || "").toString().toLowerCase().replace(/\s+/g, " ").trim();

    const url = norm(job.applyUrl).replace(/[?#].*$/, "").replace(/\/$/, "");
    if (url) keys.push(`url:${url}`);

    const title = norm(job.title);
    const company = norm(job.company);
    const location = norm(job.location);
    if (title && company) keys.push(`tcl:${title}|${company}|${location}`);

    return keys.length ? keys : [`id:${job.source}:${job.externalId}`];
  }

  applyFilters(jobs, filters) {
    let out = jobs;

    if (filters.location) {
      const loc = filters.location.toLowerCase().trim();
      out = out.filter((j) => (j.location || "").toLowerCase().includes(loc));
    }
    if (filters.company) {
      const c = filters.company.toLowerCase().trim();
      out = out.filter((j) => (j.company || "").toLowerCase().includes(c));
    }
    if (filters.remoteType && filters.remoteType !== "any") {
      out = out.filter((j) => j.remoteType === filters.remoteType);
    }
    if (filters.employmentType && filters.employmentType !== "any") {
      const et = filters.employmentType.toLowerCase().trim();
      out = out.filter((j) => (j.employmentType || "").toLowerCase().includes(et));
    }
    if (filters.experience && filters.experience !== "any") {
      const ex = filters.experience.toLowerCase().trim();
      out = out.filter((j) => (j.experience || "").toLowerCase().includes(ex));
    }
    if (filters.salary) {
      const min = Number(filters.salary);
      if (!isNaN(min) && min > 0) {
        out = out.filter((j) => {
          if (j.salaryMin == null && j.salaryMax == null) return true; // unknown → keep
          return (j.salaryMax || j.salaryMin || 0) >= min;
        });
      }
    }
    if (filters.skills) {
      const wanted = (Array.isArray(filters.skills) ? filters.skills : filters.skills.split(","))
        .map((s) => s.toLowerCase().trim())
        .filter(Boolean);
      if (wanted.length) {
        out = out.filter((j) => {
          const have = (j.skills || []).map((s) => s.toLowerCase());
          return wanted.some((w) => have.some((h) => h.includes(w)));
        });
      }
    }
    if (filters.postedWithin) {
      const days = Number(filters.postedWithin);
      if (!isNaN(days) && days > 0) {
        const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
        out = out.filter((j) => new Date(j.postedAt).getTime() >= cutoff);
      }
    }

    return out;
  }

  /**
   * Relevance = keyword hits (title weighted heavily) + recency bonus.
   * Without a query, ranking is recency-only.
   */
  rank(jobs, query) {
    const q = (query || "").toLowerCase().trim();
    const terms = q ? q.split(/\s+/).filter(Boolean) : [];
    const now = Date.now();

    const scored = jobs.map((job) => {
      let score = 0;
      if (terms.length) {
        const title = (job.title || "").toLowerCase();
        const desc = (job.description || "").toLowerCase();
        for (const term of terms) {
          if (title.includes(term)) score += 10;
          if (desc.includes(term)) score += 2;
          if ((job.skills || []).some((s) => s.toLowerCase().includes(term))) score += 5;
        }
      }
      // Recency bonus: up to +5 for jobs posted within ~30 days
      const ageDays = (now - new Date(job.postedAt).getTime()) / (24 * 60 * 60 * 1000);
      score += Math.max(0, 5 - ageDays / 6);
      return { job, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.job);
  }

  /**
   * Lightweight per-provider health probe for the diagnostics endpoint.
   * @returns {Promise<Array<{name, status, count}>>}
   */
  async healthCheck() {
    return Promise.all(
      allProviders.map(async (provider) => {
        if (!provider.isEnabled()) {
          return { name: provider.name, status: "disabled", count: 0 };
        }
        try {
          const jobs = await provider.searchJobs("developer", {});
          return {
            name: provider.name,
            status: jobs.length > 0 ? "healthy" : "empty",
            count: jobs.length,
          };
        } catch (err) {
          return { name: provider.name, status: "error", count: 0 };
        }
      })
    );
  }
}

module.exports = new JobAggregatorService();
