const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

/**
 * SmartRecruiters — public postings API. Namespaced per company identifier.
 *
 * Config:
 *   SMARTRECRUITERS_COMPANIES  (csv company identifiers, default a few public ones)
 */
class SmartRecruitersProvider extends BaseJobProvider {
  constructor() {
    super("smartrecruiters");
    this.defaultCompanies = (process.env.SMARTRECRUITERS_COMPANIES || "Visa,Bosch,Ubisoft")
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
  }

  async searchJobs(query, filters = {}) {
    const companies = filters.company ? [filters.company] : this.defaultCompanies;
    const perCompany = await Promise.all(
      companies.map((c) => this.searchCompany(c, query))
    );
    return perCompany.flat();
  }

  async searchCompany(company, query) {
    const params = new URLSearchParams({ limit: "50" });
    if (query) params.set("q", query);

    const url = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(
      company
    )}/postings?${params.toString()}`;
    logger.info(`Provider[smartrecruiters]: fetching postings for "${company}"`);

    const data = await this.fetchJSON(url, { timeout: 5000 });
    if (!data || !Array.isArray(data.content)) return [];

    return data.content.map((item) => {
      const loc = item.location || {};
      const locationParts = [loc.city, loc.region, loc.country].filter(Boolean);
      const locationName = loc.remote ? "Remote" : locationParts.join(", ");
      const companyName = item.company?.name || company;
      const companyId = item.company?.identifier || company;

      return {
        externalId: `smartrecruiters_${companyId}_${item.id}`,
        source: "smartrecruiters",
        title: item.name,
        company: companyName,
        logo: "",
        location: locationName,
        workMode: loc.remote ? "remote" : this.normalizeWorkMode(`${item.name} ${locationName}`),
        salaryRaw: null,
        currency: "",
        employmentType: item.typeOfEmployment?.label || "",
        description: this.cleanHTML(item.jobAd?.sections?.jobDescription?.text || ""),
        applyUrl: `https://jobs.smartrecruiters.com/${companyId}/${item.id}`,
        postedAt: this.toDate(item.releasedDate),
        tags: item.function?.label ? [item.function.label] : [],
      };
    });
  }
}

module.exports = SmartRecruitersProvider;
