const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

/**
 * Adzuna aggregator. Country-scoped API (path segment), so we query a small
 * configurable set of countries and merge. Requires ADZUNA_APP_ID/APP_KEY.
 *
 * Config:
 *   ADZUNA_APP_ID, ADZUNA_APP_KEY  (required)
 *   ADZUNA_COUNTRIES               (csv ISO codes, default "in,us,gb")
 */
class AdzunaProvider extends BaseJobProvider {
  constructor() {
    super("adzuna");
    this.appId = process.env.ADZUNA_APP_ID;
    this.appKey = process.env.ADZUNA_APP_KEY;
    this.countries = (process.env.ADZUNA_COUNTRIES || "in,us,gb")
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
  }

  isEnabled() {
    return !!(this.appId && this.appKey);
  }

  async searchJobs(query, filters = {}) {
    if (!this.isEnabled()) return [];

    // Limit outbound fan-out: if the user gave a location that names a country
    // we could refine, but keeping it simple — query configured countries.
    const perCountry = await Promise.all(
      this.countries.map((country) => this.searchCountry(country, query, filters))
    );
    return perCountry.flat();
  }

  async searchCountry(country, query, filters) {
    const params = new URLSearchParams({
      app_id: this.appId,
      app_key: this.appKey,
      results_per_page: "30",
      "content-type": "application/json",
    });
    if (query) params.set("what", query);
    if (filters.location) params.set("where", filters.location);
    if (filters.salary) params.set("salary_min", String(Number(filters.salary) || 0));
    if (filters.remoteType === "remote") params.set("what_or", "remote");

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params.toString()}`;
    logger.info(`Provider[adzuna]: querying country "${country}"`);

    const data = await this.fetchJSON(url);
    if (!data || !Array.isArray(data.results)) return [];

    return data.results.map((item) => {
      const title = this.cleanHTML(item.title);
      const description = this.cleanHTML(item.description);
      const locationName = item.location?.display_name || "";

      return {
        externalId: `adzuna_${country}_${item.id}`,
        source: "adzuna",
        title,
        company: item.company?.display_name || "Not Specified",
        logo: "",
        location: locationName,
        workMode: this.normalizeWorkMode(`${title} ${description} ${locationName}`),
        salaryRaw: item.salary_min || item.salary_max || null,
        currency: country === "in" ? "INR" : country === "gb" ? "GBP" : "USD",
        employmentType: item.contract_time
          ? item.contract_time.replace("_", "-")
          : "",
        description,
        applyUrl: item.redirect_url || "",
        postedAt: this.toDate(item.created),
        tags: item.category?.label ? [item.category.label] : [],
      };
    });
  }
}

module.exports = AdzunaProvider;
