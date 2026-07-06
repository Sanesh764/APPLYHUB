const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

/**
 * Arbeitnow — public job-board API (Europe-heavy, includes remote roles).
 * No key required. Keyword filtering is done client-side since the feed is
 * a flat board dump.
 */
class ArbeitnowProvider extends BaseJobProvider {
  constructor() {
    super("arbeitnow");
  }

  async searchJobs(query, filters = {}) {
    const url = "https://www.arbeitnow.com/api/job-board-api";
    logger.info("Provider[arbeitnow]: fetching job board feed");

    const data = await this.fetchJSON(url);
    if (!data || !Array.isArray(data.data)) return [];

    let listings = data.data;

    if (query) {
      const q = query.toLowerCase();
      listings = listings.filter(
        (j) =>
          (j.title || "").toLowerCase().includes(q) ||
          (j.description || "").toLowerCase().includes(q) ||
          (Array.isArray(j.tags) && j.tags.some((t) => (t || "").toLowerCase().includes(q)))
      );
    }

    return listings.map((item) => {
      const description = this.cleanHTML(item.description);
      let workMode = this.normalizeWorkMode(`${item.title} ${description} ${item.location}`);
      if (!workMode && item.remote) workMode = "remote";

      return {
        externalId: `arbeitnow_${item.slug}`,
        source: "arbeitnow",
        title: item.title,
        company: item.company_name || "Not Specified",
        logo: "",
        location: item.location || (item.remote ? "Remote" : ""),
        workMode,
        salaryRaw: null,
        currency: "",
        employmentType: Array.isArray(item.job_types) ? item.job_types.join(", ") : "",
        description,
        applyUrl: item.url || "",
        postedAt: item.created_at ? this.toDate(item.created_at * 1000) : new Date(),
        tags: Array.isArray(item.tags) ? item.tags : [],
      };
    });
  }
}

module.exports = ArbeitnowProvider;
