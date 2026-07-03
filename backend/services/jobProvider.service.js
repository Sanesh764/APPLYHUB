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
   * Sanitize text descriptions by stripping HTML tags
   */
  cleanHTML(str) {
    if (!str) return "";
    return str.replace(/<\/?[^>]+(>|$)/g, " ").trim();
  }

  /**
   * Strict verification that a job is located in India
   */
  isLocatedInIndia(locationText) {
    if (!locationText) return false;
    const text = locationText.toString().toLowerCase();
    
    // Check for explicit India text or prominent Indian tech hubs
    return (
      text.includes("india") ||
      text.includes("bangalore") ||
      text.includes("bengaluru") ||
      text.includes("mumbai") ||
      text.includes("delhi") ||
      text.includes("new delhi") ||
      text.includes("gurgaon") ||
      text.includes("gurugram") ||
      text.includes("noida") ||
      text.includes("pune") ||
      text.includes("hyderabad") ||
      text.includes("chennai") ||
      text.includes("kolkata") ||
      text.includes("ahmedabad") ||
      text.includes("jaipur") ||
      text.includes("kochi") ||
      text.includes("trivandrum") ||
      text.includes(", in")
    );
  }

  /**
   * Parse City and State from a composite location string
   */
  parseStateAndCity(locationText) {
    let city = "";
    let state = "";
    if (!locationText) return { city, state };

    // Strip "India" suffix
    const cleanText = locationText.toString().replace(/,\s*india/i, "").trim();
    const parts = cleanText.split(",").map(p => p.trim());
    
    if (parts.length >= 2) {
      city = parts[0];
      state = parts[1];
    } else if (parts.length === 1) {
      city = parts[0];
    }

    // Normalize Bangalore
    if (city.toLowerCase() === "bangalore") city = "Bengaluru";

    return { city, state };
  }

  /**
   * Filter out external relocation offerings outside India
   */
  requiresForeignRelocation(descriptionText, titleText) {
    const text = ((titleText || "") + " " + (descriptionText || "")).toLowerCase();
    
    // Check if the job requires relocating to USA, Europe, Germany, UK, Canada, Australia, etc.
    const relocationKeywords = ["relocate to", "relocation to", "relocation offered to"];
    const hasRelocationKeyword = relocationKeywords.some(kw => text.includes(kw));

    if (hasRelocationKeyword) {
      // Exclude if it specifies target destination outside India
      const foreignDestinations = ["germany", "usa", "us", "united states", "london", "uk", "united kingdom", "canada", "australia", "berlin", "singapore"];
      const isForeignDest = foreignDestinations.some(dest => text.includes(dest));
      const isIndiaDest = text.includes("relocate to india") || text.includes("relocation within india") || text.includes("india-wide");
      
      if (isForeignDest && !isIndiaDest) {
        return true;
      }
    }
    
    return false;
  }
}

// -----------------------------------------------------------------------------
// Adzuna India Search Provider
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
      const page = 1;
      let url = `https://api.adzuna.com/v1/api/jobs/in/search/${page}?app_id=${this.appId}&app_key=${this.appKey}&results_per_page=30`;
      
      if (filters.query) {
        url += `&what=${encodeURIComponent(filters.query)}`;
      }
      if (filters.location) {
        url += `&where=${encodeURIComponent(filters.location)}`;
      }
      if (filters.salary) {
        url += `&salary_min=${Number(filters.salary)}`;
      }

      logger.info("Adzuna India Provider: Querying Adzuna India API endpoint...");
      const response = await fetch(url, { headers: this.headers, signal: AbortSignal.timeout(5000) });
      
      if (!response.ok) {
        logger.warn(`Adzuna India API returned HTTP status ${response.status}`);
        return [];
      }

      const data = await response.json();
      if (!data || !data.results) return [];

      const mappedJobs = [];

      for (const item of data.results) {
        const title = this.cleanHTML(item.title);
        const description = this.cleanHTML(item.description);

        // Exclude foreign relocation requirements
        if (this.requiresForeignRelocation(description, title)) {
          continue;
        }

        // Verify the location display name is inside India
        const locationName = item.location.display_name || "India";
        if (!this.isLocatedInIndia(locationName)) {
          continue;
        }

        let workMode = "onsite";
        const textLower = (title + " " + description).toLowerCase();
        if (textLower.includes("remote")) {
          workMode = "remote";
        } else if (textLower.includes("hybrid")) {
          workMode = "hybrid";
        }

        // Extract state and city from location area array
        let state = "";
        let city = "";
        if (item.location && item.location.area && Array.isArray(item.location.area)) {
          state = item.location.area[1] || "";
          city = item.location.area[2] || item.location.area[3] || item.location.display_name || "";
        } else {
          const parsed = this.parseStateAndCity(locationName);
          city = parsed.city;
          state = parsed.state;
        }

        let jobType = "full-time";
        if (item.contract_time) {
          jobType = item.contract_time.replace("_", "-");
        }

        mappedJobs.push({
          id: `adzuna_${item.id}`,
          title,
          companyName: item.company.display_name,
          companyLogo: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?auto=format&fit=crop&w=120&h=120&q=80",
          location: locationName,
          state,
          city,
          workMode,
          salary: item.salary_min || item.salary_max || null,
          experienceLevel: "Mid-Senior",
          jobType,
          description,
          benefits: [],
          requirements: [],
          source: "adzuna",
          externalId: item.id.toString(),
          postedDate: new Date(item.created),
          applyUrl: item.redirect_url,
          isAutoSupported: false,
        });
      }

      return mappedJobs;
    } catch (error) {
      logger.error("Adzuna India Provider: API failed", { error: error.message });
      return [];
    }
  }
}

// -----------------------------------------------------------------------------
// Remotive Search Provider (Indian target filter)
// -----------------------------------------------------------------------------
class RemotiveJobProvider extends BaseJobProvider {
  constructor() {
    super("remotive");
  }

  async searchJobs(filters) {
    try {
      let url = "https://remotive.com/api/remote-jobs?limit=50";
      
      if (filters.query) {
        url += `&search=${encodeURIComponent(filters.query)}`;
      }

      logger.info("Remotive India Provider: Querying remote developer feeds...");
      const response = await fetch(url, { headers: this.headers, signal: AbortSignal.timeout(5000) });
      
      if (!response.ok) {
        logger.warn(`Remotive API returned HTTP status ${response.status}`);
        return [];
      }

      const data = await response.json();
      if (!data || !data.jobs) return [];

      const mappedJobs = [];

      for (const item of data.jobs) {
        const requiredLocation = item.candidate_required_location || "";
        
        // Remotive only if they explicitly provide jobs located in India
        if (!this.isLocatedInIndia(requiredLocation)) {
          continue;
        }

        const title = item.title;
        const description = this.cleanHTML(item.description);

        if (this.requiresForeignRelocation(description, title)) {
          continue;
        }

        const parsed = this.parseStateAndCity(requiredLocation);

        mappedJobs.push({
          id: `remotive_${item.id}`,
          title,
          companyName: item.company_name,
          companyLogo: item.company_logo || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=120&h=120&q=80",
          location: requiredLocation,
          state: parsed.state,
          city: parsed.city,
          workMode: "remote",
          salary: item.salary || null,
          experienceLevel: "Mid-Senior",
          jobType: item.job_type || "full-time",
          description,
          benefits: [],
          requirements: item.tags || [],
          source: "remotive",
          externalId: item.id.toString(),
          postedDate: new Date(item.publication_date),
          applyUrl: item.url,
          isAutoSupported: false,
        });
      }

      return mappedJobs;
    } catch (error) {
      logger.error("Remotive India Provider: API failed", { error: error.message });
      return [];
    }
  }
}

// -----------------------------------------------------------------------------
// Arbeitnow Search Provider (Germany-centric, usually fully filtered out)
// -----------------------------------------------------------------------------
class ArbeitnowJobProvider extends BaseJobProvider {
  constructor() {
    super("arbeitnow");
  }

  async searchJobs(filters) {
    try {
      const url = "https://www.arbeitnow.com/api/job-board-api";
      logger.info("Arbeitnow India Provider: Fetching Germany job feed...");
      const response = await fetch(url, { headers: this.headers, signal: AbortSignal.timeout(5000) });

      if (!response.ok) {
        logger.warn(`Arbeitnow API returned HTTP status ${response.status}`);
        return [];
      }

      const data = await response.json();
      if (!data || !data.data) return [];

      let listings = data.data;

      // Filter locally for India location
      listings = listings.filter((item) => this.isLocatedInIndia(item.location));

      if (filters.query) {
        const queryLower = (filters.query || "").toLowerCase();
        listings = listings.filter(
          (j) =>
            (j.title || "").toLowerCase().includes(queryLower) ||
            (j.description || "").toLowerCase().includes(queryLower)
        );
      }

      return listings.map((item) => {
        const parsed = this.parseStateAndCity(item.location);
        let workMode = "onsite";
        if ((item.title || "").toLowerCase().includes("remote") || (item.description || "").toLowerCase().includes("remote")) {
          workMode = "remote";
        }

        return {
          id: `arbeitnow_${item.slug}`,
          title: item.title,
          companyName: item.company_name,
          companyLogo: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=120&h=120&q=80",
          location: item.location || "India",
          state: parsed.state,
          city: parsed.city,
          workMode,
          salary: null,
          experienceLevel: "Mid-level",
          jobType: "full-time",
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
      logger.error("Arbeitnow India Provider: API failed", { error: error.message });
      return [];
    }
  }
}

// -----------------------------------------------------------------------------
// Greenhouse Board Search Provider (India target filter)
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
        logger.info(`Greenhouse India Provider: Fetching public board for "${board}"...`);
        const response = await fetch(url, { headers: this.headers, signal: AbortSignal.timeout(4000) });

        if (!response.ok) continue;

        const data = await response.json();
        if (data && data.jobs) {
          for (const item of data.jobs) {
            const locationName = item.location?.name || "";
            
            // Only keep if located in India
            if (!this.isLocatedInIndia(locationName)) {
              continue;
            }

            const title = item.title;
            const description = this.cleanHTML(item.content);

            if (this.requiresForeignRelocation(description, title)) {
              continue;
            }

            const parsed = this.parseStateAndCity(locationName);

            aggregated.push({
              id: `greenhouse_${board}_${item.id}`,
              title,
              companyName: board.charAt(0).toUpperCase() + board.slice(1),
              companyLogo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80",
              location: locationName,
              state: parsed.state,
              city: parsed.city,
              workMode: locationName.toLowerCase().includes("remote") ? "remote" : "onsite",
              salary: null,
              experienceLevel: "Mid-level",
              jobType: "full-time",
              description,
              benefits: [],
              requirements: [],
              source: "greenhouse",
              externalId: item.id.toString(),
              postedDate: new Date(),
              applyUrl: item.absolute_url,
              isAutoSupported: false,
            });
          }
        }
      } catch (err) {
        logger.warn(`Greenhouse India Provider: Board "${board}" query failed: ${err.message}`);
      }
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      return aggregated.filter((j) => (j.title || "").toLowerCase().includes(q) || (j.description || "").toLowerCase().includes(q));
    }
    return aggregated;
  }
}

// -----------------------------------------------------------------------------
// Lever Postings Search Provider (India target filter)
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
        logger.info(`Lever India Provider: Fetching public postings for "${board}"...`);
        const response = await fetch(url, { headers: this.headers, signal: AbortSignal.timeout(4000) });

        if (!response.ok) continue;

        const data = await response.json();
        if (data && Array.isArray(data)) {
          for (const item of data) {
            const locationName = item.categories?.location || "";

            // Only keep if located in India
            if (!this.isLocatedInIndia(locationName)) {
              continue;
            }

            const title = item.text;
            const description = this.cleanHTML(item.descriptionPlain + " " + item.additionalPlain);

            if (this.requiresForeignRelocation(description, title)) {
              continue;
            }

            const parsed = this.parseStateAndCity(locationName);

            aggregated.push({
              id: `lever_${board}_${item.id}`,
              title,
              companyName: board.charAt(0).toUpperCase() + board.slice(1),
              companyLogo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&h=120&q=80",
              location: locationName,
              state: parsed.state,
              city: parsed.city,
              workMode: locationName.toLowerCase().includes("remote") ? "remote" : "onsite",
              salary: null,
              experienceLevel: "Mid-level",
              jobType: "full-time",
              description,
              benefits: [],
              requirements: [],
              source: "lever",
              externalId: item.id,
              postedDate: new Date(item.createdAt),
              applyUrl: item.hostedUrl,
              isAutoSupported: false,
            });
          }
        }
      } catch (err) {
        logger.warn(`Lever India Provider: Board "${board}" query failed: ${err.message}`);
      }
    }

    if (filters.query) {
      const q = filters.query.toLowerCase();
      return aggregated.filter((j) => (j.title || "").toLowerCase().includes(q) || (j.description || "").toLowerCase().includes(q));
    }
    return aggregated;
  }
}

// -----------------------------------------------------------------------------
// Combined Job Provider Service (Aggregator targeting India)
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
    logger.info(`Job Provider Service: Running parallel search for Indian Market across: ${this.providers.map(p => p.name).join(", ")}`);
    const searchStartTime = Date.now();

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
    const searchDuration = Date.now() - searchStartTime;

    // Merge results and de-duplicate by matching title + company name
    const allJobs = [];
    const seen = new Set();
    let totalFetched = 0;

    for (const providerJobs of results) {
      totalFetched += providerJobs.length;
      for (const job of providerJobs) {
        const uniqueKey = `${(job.title || "").toLowerCase().trim()}_${(job.companyName || "").toLowerCase().trim()}`;
        if (!seen.has(uniqueKey)) {
          seen.add(uniqueKey);
          allJobs.push(job);
        }
      }
    }

    const duplicatesRemoved = totalFetched - allJobs.length;

    // Apply strict client-side India-focused filters
    let filteredJobs = allJobs;

    // Filter by workMode
    if (filters.workMode && filters.workMode !== "any") {
      filteredJobs = filteredJobs.filter(
        (job) => (job.workMode || "").toLowerCase() === (filters.workMode || "").toLowerCase()
      );
    }

    // Filter by location display name
    if (filters.location) {
      const loc = (filters.location || "").toLowerCase();
      filteredJobs = filteredJobs.filter((job) => (job.location || "").toLowerCase().includes(loc));
    }

    // Filter by State
    if (filters.state) {
      const s = (filters.state || "").toLowerCase().trim();
      filteredJobs = filteredJobs.filter((job) => job.state && (job.state || "").toLowerCase().includes(s));
    }

    // Filter by City
    if (filters.city) {
      const c = (filters.city || "").toLowerCase().trim();
      filteredJobs = filteredJobs.filter((job) => job.city && (job.city || "").toLowerCase().includes(c));
    }

    // Filter by Company
    if (filters.company) {
      const comp = (filters.company || "").toLowerCase().trim();
      filteredJobs = filteredJobs.filter((job) => job.companyName && (job.companyName || "").toLowerCase().includes(comp));
    }

    // Filter by Job Type
    if (filters.jobType && filters.jobType !== "any") {
      const jt = (filters.jobType || "").toLowerCase().trim();
      filteredJobs = filteredJobs.filter((job) => job.jobType && (job.jobType || "").toLowerCase().includes(jt));
    }

    // Filter by experience level
    if (filters.experienceLevel && filters.experienceLevel !== "any") {
      const exp = (filters.experienceLevel || "").toLowerCase().trim();
      filteredJobs = filteredJobs.filter((job) => job.experienceLevel && (job.experienceLevel || "").toLowerCase().includes(exp));
    }

    // Filter by salary minimum
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

    logger.info(`Job Provider Service Metrics: Search Time: ${searchDuration}ms | Total Jobs Found: ${totalFetched} | Duplicates Removed: ${duplicatesRemoved} | Final Count: ${filteredJobs.length}`);
    return filteredJobs;
  }
}

module.exports = new JobProviderService();
