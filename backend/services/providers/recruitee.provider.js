const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

/**
 * Recruitee — public offers API. Namespaced per company subdomain.
 *
 * Config:
 *   RECRUITEE_COMPANIES  (csv company slugs, default a few public ones)
 */
class RecruiteeProvider extends BaseJobProvider {
  constructor() {
    super("recruitee");
    this.defaultCompanies = (process.env.RECRUITEE_COMPANIES || "recruitee,piktochart")
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
  }

  async searchJobs(query, filters = {}) {
    const companies = filters.company
      ? [filters.company.toLowerCase().replace(/\s+/g, "")]
      : this.defaultCompanies;

    const perCompany = await Promise.all(companies.map((c) => this.searchCompany(c)));
    let jobs = perCompany.flat();

    if (query) {
      const q = query.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          (j.title || "").toLowerCase().includes(q) ||
          (j.description || "").toLowerCase().includes(q)
      );
    }
    return jobs;
  }

  async searchCompany(company) {
    const url = `https://${company}.recruitee.com/api/offers/`;
    logger.info(`Provider[recruitee]: fetching offers for "${company}"`);

    const data = await this.fetchJSON(url, { timeout: 5000 });
    if (!data || !Array.isArray(data.offers)) return [];

    const companyName = company.charAt(0).toUpperCase() + company.slice(1);

    return data.offers.map((item) => {
      const locationName = [item.city, item.country].filter(Boolean).join(", ");
      const description = this.cleanHTML(item.description || item.requirements || "");
      return {
        externalId: `recruitee_${company}_${item.id}`,
        source: "recruitee",
        title: item.title,
        company: item.company_name || companyName,
        logo: "",
        location: item.remote ? "Remote" : locationName,
        workMode: item.remote
          ? "remote"
          : this.normalizeWorkMode(`${item.title} ${locationName}`),
        salaryRaw: null,
        currency: "",
        employmentType: item.employment_type_code || item.category_code || "",
        description,
        applyUrl: item.careers_url || item.careers_apply_url || "",
        postedAt: this.toDate(item.published_at || item.created_at),
        tags: Array.isArray(item.tags) ? item.tags : [],
      };
    });
  }
}

module.exports = RecruiteeProvider;
