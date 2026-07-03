const logger = require("../config/logger");

// -----------------------------------------------------------------------------
// Base Job Provider Interface
// -----------------------------------------------------------------------------
class BaseJobProvider {
  constructor(name) {
    this.name = name;
    this.headers = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "application/json",
    };
  }

  /**
   * Search jobs from provider. Overridden by child adapters.
   */
  async searchJobs(filters) {
    return [];
  }

  /**
   * Sanitize text descriptions by stripping html tags
   */
  cleanHTML(str) {
    if (!str) return "";
    return str.replace(/<\/?[^>]+(>|$)/g, " ").trim();
  }
}

// -----------------------------------------------------------------------------
// Adzuna Search Provider
// -----------------------------------------------------------------------------
class AdzunaJobProvider extends BaseJobProvider {
  constructor() {
    super("adzuna");
    this.appId = process.env.ADZUNA_APP_ID;
    this.appKey = process.env.ADZUNA_APP_KEY;
    this.isEnabled = !!(this.appId && this.appKey);
  }

  async searchJobs(filters) {
    if (!this.isEnabled) return [];

    try {
      const country = filters.country || "us";
      const page = 1;
      
      let url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?app_id=${this.appId}&app_key=${this.appKey}&results_per_page=10`;
      
      if (filters.query) url += `&what=${encodeURIComponent(filters.query)}`;
      if (filters.location) url += `&where=${encodeURIComponent(filters.location)}`;
      if (filters.salary) url += `&salary_min=${Number(filters.salary)}`;

      logger.info(`Adzuna Provider: Querying Adzuna API at country "${country}"...`);
      const response = await fetch(url, { headers: this.headers, signal: AbortSignal.timeout(5000) });
      
      if (!response.ok) {
        logger.warn(`Adzuna API returned HTTP status ${response.status}`);
        return [];
      }

      const data = await response.json();
      if (!data || !data.results) return [];

      return data.results.map((item) => {
        let workMode = "onsite";
        const titleLower = item.title.toLowerCase();
        const descLower = item.description.toLowerCase();
        
        if (titleLower.includes("remote") || descLower.includes("remote")) {
          workMode = "remote";
        } else if (titleLower.includes("hybrid") || descLower.includes("hybrid")) {
          workMode = "hybrid";
        }

        return {
          id: `adzuna_${item.id}`,
          title: this.cleanHTML(item.title),
          companyName: item.company.display_name,
          companyLogo: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=120&h=120&q=80",
          location: item.location.display_name,
          workMode,
          salary: item.salary_min || item.salary_max || null,
          experienceLevel: "Mid-Senior",
          description: this.cleanHTML(item.description),
          benefits: [],
          requirements: [],
          source: "adzuna",
          externalId: item.id.toString(),
          postedDate: new Date(item.created),
          applyUrl: item.redirect_url,
          isAutoSupported: false,
        };
      });
    } catch (error) {
      logger.error("Adzuna Provider: API failed", { error: error.message });
      return [];
    }
  }
}

// -----------------------------------------------------------------------------
// Remotive Search Provider (Remote jobs)
// -----------------------------------------------------------------------------
class RemotiveJobProvider extends BaseJobProvider {
  constructor() {
    super("remotive");
  }

  async searchJobs(filters) {
    try {
      let url = "https://remotive.com/api/remote-jobs?limit=15";
      
      if (filters.query) {
        url += `&search=${encodeURIComponent(filters.query)}`;
      }

      logger.info("Remotive Provider: Fetching remote developer jobs...");
      const response = await fetch(url, { headers: this.headers, signal: AbortSignal.timeout(5000) });
      
      if (!response.ok) {
        logger.warn(`Remotive API returned HTTP status ${response.status}`);
        return [];
      }

      const data = await response.json();
      if (!data || !data.jobs) return [];

      return data.jobs.map((item) => ({
        id: `remotive_${item.id}`,
        title: item.title,
        companyName: item.company_name,
        companyLogo: item.company_logo || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=120&h=120&q=80",
        location: item.candidate_required_location || "Worldwide (Remote)",
        workMode: "remote",
        salary: item.salary || null,
        experienceLevel: "Mid-Senior",
        description: this.cleanHTML(item.description),
        benefits: [],
        requirements: item.tags || [],
        source: "remotive",
        externalId: item.id.toString(),
        postedDate: new Date(item.publication_date),
        applyUrl: item.url,
        isAutoSupported: false,
      }));
    } catch (error) {
      logger.error("Remotive Provider: API failed", { error: error.message });
      return [];
    }
  }
}

// -----------------------------------------------------------------------------
// Arbeitnow Search Provider (Germany-based listings)
// -----------------------------------------------------------------------------
class ArbeitnowJobProvider extends BaseJobProvider {
  constructor() {
    super("arbeitnow");
  }

  async searchJobs(filters) {
    try {
      const url = "https://www.arbeitnow.com/api/job-board-api";
      logger.info("Arbeitnow Provider: Fetching Germany job board listings...");
      const response = await fetch(url, { headers: this.headers, signal: AbortSignal.timeout(5000) });

      if (!response.ok) {
        logger.warn(`Arbeitnow API returned HTTP status ${response.status}`);
        return [];
      }

      const data = await response.json();
      if (!data || !data.data) return [];

      let listings = data.data;

      if (filters.query) {
        const queryLower = filters.query.toLowerCase();
        listings = listings.filter(
          (j) =>
            j.title.toLowerCase().includes(queryLower) ||
            j.description.toLowerCase().includes(queryLower)
        );
      }

      return listings.map((item) => {
        let workMode = "onsite";
        if (item.title.toLowerCase().includes("remote") || item.description.toLowerCase().includes("remote")) {
          workMode = "remote";
        }

        return {
          id: `arbeitnow_${item.slug}`,
          title: item.title,
          companyName: item.company_name,
          companyLogo: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=120&h=120&q=80",
          location: item.location || "Germany",
          workMode,
          salary: null,
          experienceLevel: "Mid-level",
          description: this.cleanHTML(item.description),
          benefits: [],
          requirements: item.tags || [],
          source: "arbeitnow",
          externalId: item.slug,
          postedDate: new Date(),
          applyUrl: item.url,
          isAutoSupported: false,
        };
      });
    } catch (error) {
      logger.error("Arbeitnow Provider: API failed", { error: error.message });
      return [];
    }
  }
}

// -----------------------------------------------------------------------------
// Greenhouse Board Search Provider
// -----------------------------------------------------------------------------
class GreenhouseJobProvider extends BaseJobProvider {
  constructor() {
    super("greenhouse");
    this.popularBoards = ["figma", "stripe"];
  }

  async searchJobs(filters) {
    const boards = filters.company ? [filters.company.toLowerCase()] : this.popularBoards;
    const aggregated = [];

    for (const board of boards) {
      try {
        const url = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`;
        logger.info(`Greenhouse Provider: Fetching public board for "${board}"...`);
        const response = await fetch(url, { headers: this.headers, signal: AbortSignal.timeout(4000) });

        if (!response.ok) continue;

        const data = await response.json();
        if (data && data.jobs) {
          const mapped = data.jobs.map((item) => ({
            id: `greenhouse_${board}_${item.id}`,
            title: item.title,
            companyName: board.charAt(0).toUpperCase() + board.slice(1),
            companyLogo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80",
            location: item.location?.name || "Multiple Locations",
            workMode: item.location?.name?.toLowerCase().includes("remote") ? "remote" : "onsite",
            salary: null,
            experienceLevel: "Mid-level",
            description: this.cleanHTML(item.content),
            benefits: [],
            requirements: [],
            source: "greenhouse",
            externalId: item.id.toString(),
            postedDate: new Date(),
            applyUrl: item.absolute_url,
            isAutoSupported: false,
          }));
          aggregated.push(...mapped);
        }
      } catch (err) {
        logger.warn(`Greenhouse Provider: Board "${board}" query failed: ${err.message}`);
      }
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      return aggregated.filter((j) => j.title.toLowerCase().includes(q) || j.description.toLowerCase().includes(q));
    }
    return aggregated;
  }
}

// -----------------------------------------------------------------------------
// Lever Postings Search Provider
// -----------------------------------------------------------------------------
class LeverJobProvider extends BaseJobProvider {
  constructor() {
    super("lever");
    this.popularBoards = ["vercel", "lever"];
  }

  async searchJobs(filters) {
    const boards = filters.company ? [filters.company.toLowerCase()] : this.popularBoards;
    const aggregated = [];

    for (const board of boards) {
      try {
        const url = `https://api.lever.co/v0/postings/${board}?mode=json`;
        logger.info(`Lever Provider: Fetching public postings for "${board}"...`);
        const response = await fetch(url, { headers: this.headers, signal: AbortSignal.timeout(4000) });

        if (!response.ok) continue;

        const data = await response.json();
        if (data && Array.isArray(data)) {
          const mapped = data.map((item) => ({
            id: `lever_${board}_${item.id}`,
            title: item.text,
            companyName: board.charAt(0).toUpperCase() + board.slice(1),
            companyLogo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&h=120&q=80",
            location: item.categories?.location || "Multiple Locations",
            workMode: item.categories?.location?.toLowerCase().includes("remote") ? "remote" : "onsite",
            salary: null,
            experienceLevel: "Mid-level",
            description: this.cleanHTML(item.descriptionPlain + " " + item.additionalPlain),
            benefits: [],
            requirements: [],
            source: "lever",
            externalId: item.id,
            postedDate: new Date(item.createdAt),
            applyUrl: item.hostedUrl,
            isAutoSupported: false,
          }));
          aggregated.push(...mapped);
        }
      } catch (err) {
        logger.warn(`Lever Provider: Board "${board}" query failed: ${err.message}`);
      }
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      return aggregated.filter((j) => j.title.toLowerCase().includes(q) || j.description.toLowerCase().includes(q));
    }
    return aggregated;
  }
}

// -----------------------------------------------------------------------------
// Combined Job Provider Service (Aggregator)
// -----------------------------------------------------------------------------
class JobProviderService {
  constructor() {
    this.providers = [
      new RemotiveJobProvider(),
      new ArbeitnowJobProvider(),
      new GreenhouseJobProvider(),
      new LeverJobProvider(),
    ];

    const adzuna = new AdzunaJobProvider();
    if (adzuna.isEnabled) {
      this.providers.push(adzuna);
    }
  }

  /**
   * Aggregate job listings from all enabled search providers in parallel
   */
  async searchJobs(filters = {}) {
    logger.info(`Job Provider Service: Running parallel search across providers: ${this.providers.map(p => p.name).join(", ")}`);

    // Run parallel searches with individual try-catch wraps
    const searchPromises = this.providers.map(async (provider) => {
      try {
        return await provider.searchJobs(filters);
      } catch (err) {
        logger.error(`Job Provider Service: Provider "${provider.name}" failed: ${err.message}`);
        return [];
      }
    });

    const results = await Promise.all(searchPromises);

    // Merge results and de-duplicate by matching title + company name
    const allJobs = [];
    const seen = new Set();

    for (const providerJobs of results) {
      for (const job of providerJobs) {
        const uniqueKey = `${job.title.toLowerCase().trim()}_${job.companyName.toLowerCase().trim()}`;
        if (!seen.has(uniqueKey)) {
          seen.add(uniqueKey);
          allJobs.push(job);
        }
      }
    }

    // Apply client-side filters
    let filteredJobs = allJobs;

    if (filters.workMode && filters.workMode !== "any") {
      filteredJobs = filteredJobs.filter(
        (job) => job.workMode.toLowerCase() === filters.workMode.toLowerCase()
      );
    }

    if (filters.location) {
      const loc = filters.location.toLowerCase();
      filteredJobs = filteredJobs.filter((job) => job.location.toLowerCase().includes(loc));
    }

    if (filters.salary) {
      const minSalary = Number(filters.salary);
      filteredJobs = filteredJobs.filter((job) => {
        if (!job.salary) return true;
        const numeric = Number(job.salary.toString().replace(/[^0-9]/g, ""));
        return isNaN(numeric) || numeric === 0 || numeric >= minSalary;
      });
    }

    // Sort by postedDate descending
    filteredJobs.sort((a, b) => b.postedDate - a.postedDate);

    logger.info(`Job Provider Service: Search aggregation complete. Returning ${filteredJobs.length} real jobs.`);
    return filteredJobs;
  }
}

module.exports = new JobProviderService();
