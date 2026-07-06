const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

/**
 * Remotive — curated remote jobs, fully public, no key required.
 * Every listing is remote by definition.
 */
class RemotiveProvider extends BaseJobProvider {
  constructor() {
    super("remotive");
  }

  async searchJobs(query, filters = {}) {
    const params = new URLSearchParams({ limit: "50" });
    if (query) params.set("search", query);

    const url = `https://remotive.com/api/remote-jobs?${params.toString()}`;
    logger.info("Provider[remotive]: querying remote job feed");

    const data = await this.fetchJSON(url);
    if (!data || !Array.isArray(data.jobs)) return [];

    return data.jobs.map((item) => {
      const description = this.cleanHTML(item.description);
      return {
        externalId: `remotive_${item.id}`,
        source: "remotive",
        title: item.title,
        company: item.company_name || "Not Specified",
        logo: item.company_logo || "",
        location: item.candidate_required_location || "Remote",
        workMode: "remote",
        salaryRaw: item.salary || null,
        currency: "",
        employmentType: item.job_type || "",
        description,
        applyUrl: item.url || "",
        postedAt: this.toDate(item.publication_date),
        tags: Array.isArray(item.tags) ? item.tags : [],
      };
    });
  }
}

module.exports = RemotiveProvider;
