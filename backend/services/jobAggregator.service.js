const { providers } = require("./providers");
const enrichmentService = require("./jobEnrichment.service");
const matchingService = require("./matching.service");
const countryService = require("./country.service");
const Resume = require("../models/Resume");
const logger = require("../config/logger");

/**
 * -----------------------------------------------------------------------------
 * Job Aggregator Service
 * -----------------------------------------------------------------------------
 * Fans out a search across every enabled provider, normalizes + deterministically
 * enriches each result, removes duplicates across sources, applies filters, and
 * ranks by relevance.
 */
class JobAggregatorService {
  /**
   * @param {string} query
   * @param {Object} filters  { location, company, remoteType, employmentType,
   *   experience, salary, skills, postedWithin, country }
   * @param {string} userId
   * @returns {Promise<Array<Object>>} enriched, deduped, filtered, ranked jobs
   */
  async search(query = "", filters = {}, userId = null) {
    const start = Date.now();
    const targetCountry = filters.country || "India";
    
    logger.info(
      `Aggregator: searching "${query || "*"}" for country "${targetCountry}" across [${providers.map((p) => p.name).join(", ")}]`
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

    // 3. Duplicate detection across providers (keep newest) (Requirement 6)
    const deduped = this.deduplicate(enriched);

    // 4. Country-agnostic filtering (Requirement 1)
    const countryFiltered = deduped.filter((job) =>
      countryService.allowsCountryApplicants(job, targetCountry)
    );

    // 5. Apply user filters
    const filtered = this.applyFilters(countryFiltered, filters);

    // 6. Retrieve active resume for weighted ranking (Requirement 8)
    let resume = null;
    if (userId) {
      try {
        resume = await Resume.findOne({ userId, isActive: true });
      } catch (err) {
        logger.warn(`Aggregator: failed to fetch resume for user ${userId} — ${err.message}`);
      }
    }

    // 7. Rank by weighted relevance (Requirement 8)
    const ranked = await this.rank(filtered, query, targetCountry, resume);

    logger.info(
      `Aggregator: fetched ${rawJobs.length} → deduped ${deduped.length} → country filtered ${countryFiltered.length} → final filtered ${filtered.length} in ${Date.now() - start}ms`
    );
    return ranked;
  }

  /**
   * Jaccard description similarity helper.
   */
  getDescriptionSimilarity(desc1, desc2) {
    if (!desc1 || !desc2) return 0;
    const d1 = desc1.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).slice(0, 100);
    const d2 = desc2.toLowerCase().replace(/[^a-z0-9\s]/g, "").split(/\s+/).slice(0, 100);
    const s1 = new Set(d1);
    const s2 = new Set(d2);
    const intersect = new Set([...s1].filter(x => s2.has(x)));
    const union = new Set([...s1, ...s2]);
    if (union.size === 0) return 0;
    return intersect.size / union.size;
  }

  /**
   * Better duplicate detection (Requirement 6).
   * Checks company, title, apply URL, location, and description similarity.
   */
  deduplicate(jobs) {
    const deduped = [];
    
    for (const incoming of jobs) {
      let isDuplicate = false;
      
      for (let i = 0; i < deduped.length; i++) {
        const existing = deduped[i];
        
        // 1. Direct apply url match
        const urlMatch = incoming.applyUrl && existing.applyUrl && 
          incoming.applyUrl.replace(/[?#].*$/, "").replace(/\/$/, "") === existing.applyUrl.replace(/[?#].*$/, "").replace(/\/$/, "");
          
        // 2. Title + Company + Location match
        const norm = (s) => (s || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "").trim();
        const titleMatch = norm(incoming.title) === norm(existing.title);
        const companyMatch = norm(incoming.company) === norm(existing.company);
        const locationMatch = norm(incoming.location) === norm(existing.location);
        
        // 3. Description similarity
        const descSim = this.getDescriptionSimilarity(incoming.description, existing.description);
        
        if (urlMatch || (companyMatch && titleMatch && (locationMatch || descSim > 0.75))) {
          isDuplicate = true;
          // Keep the newest posting
          if (new Date(incoming.postedAt) > new Date(existing.postedAt)) {
            deduped[i] = incoming;
          }
          break;
        }
      }
      
      if (!isDuplicate) {
        deduped.push(incoming);
      }
    }
    
    return deduped;
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
   * Smart weighted ranking algorithm (Requirement 8):
   * 40% Resume Match
   * 20% Country Priority (e.g. India Priority)
   * 15% Freshness
   * 10% Salary
   * 10% Skill Match (search query relevance)
   * 5% Company Quality
   */
  async rank(jobs, query, country = "India", resume = null) {
    const q = (query || "").toLowerCase().trim();
    const terms = q ? q.split(/\s+/).filter(Boolean) : [];
    const now = Date.now();

    const scored = jobs.map((job) => {
      let score = 0;

      // 1. Resume Match (40%)
      let resumeScore = 0;
      if (resume && resume.parsedData) {
        resumeScore = matchingService.calculateKeywordScore(resume.parsedData, job);
      }
      score += (resumeScore / 100) * 40; // 0 to 40 points

      // 2. Country Priority (20%)
      let countryScore = 0;
      const tier = countryService.countryTier(job, country);
      if (tier === 0) countryScore = 20;      // Local onsite/hybrid
      else if (tier === 1) countryScore = 15; // Local remote
      else if (tier === 2) countryScore = 10;  // Global remote open to country
      else countryScore = 0;
      score += countryScore; // 0 to 20 points

      // 3. Freshness (15%)
      let freshnessScore = 0;
      const ageDays = (now - new Date(job.postedAt).getTime()) / (24 * 60 * 60 * 1000);
      if (ageDays <= 1) freshnessScore = 15;
      else if (ageDays <= 3) freshnessScore = 12;
      else if (ageDays <= 7) freshnessScore = 9;
      else if (ageDays <= 14) freshnessScore = 5;
      else if (ageDays <= 30) freshnessScore = 2;
      else freshnessScore = 0;
      score += freshnessScore; // 0 to 15 points

      // 4. Salary (10%)
      let salaryScore = 0;
      if (job.salaryMax || job.salaryMin) {
        const val = job.salaryMax || job.salaryMin || 0;
        if (val > 1500000) salaryScore = 10;
        else if (val >= 600000) salaryScore = 7;
        else salaryScore = 4;
      }
      score += salaryScore; // 0 to 10 points

      // 5. Skill Match (10%)
      let skillMatchScore = 0;
      if (terms.length) {
        const title = (job.title || "").toLowerCase();
        const desc = (job.description || "").toLowerCase();
        const jobSkills = (job.skills || []).map(s => s.toLowerCase());
        
        let matches = 0;
        for (const term of terms) {
          if (title.includes(term)) matches += 3;
          if (desc.includes(term)) matches += 0.5;
          if (jobSkills.some(s => s.includes(term))) matches += 1.5;
        }
        skillMatchScore = Math.min(10, matches * 2);
      }
      score += skillMatchScore; // 0 to 10 points

      // 6. Company Quality (5%)
      let companyQualityScore = 2;
      const c = (job.company || "").toLowerCase();
      const topBrands = ["google", "microsoft", "amazon", "meta", "apple", "netflix", "stripe", "figma", "coinbase", "dropbox", "gitlab", "razorpay", "paytm", "swiggy", "zomato", "wipro", "infosys", "tcs"];
      if (topBrands.some(brand => c.includes(brand)) || job.logo || job.companyWebsite !== "Not Specified") {
        companyQualityScore = 5;
      }
      score += companyQualityScore; // 0 to 5 points

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
