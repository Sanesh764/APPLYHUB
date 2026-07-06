const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

/**
 * Greenhouse — public board API. Jobs are namespaced per company "board token".
 * We query a configurable set of boards, plus `filters.company` when provided.
 *
 * Config:
 *   GREENHOUSE_BOARDS  (csv board tokens, default a few well-known public boards)
 */
class GreenhouseProvider extends BaseJobProvider {
  constructor() {
    super("greenhouse");
    this.defaultBoards = (process.env.GREENHOUSE_BOARDS || "stripe,figma,gitlab,coinbase,dropbox")
      .split(",")
      .map((b) => b.trim().toLowerCase())
      .filter(Boolean);
  }

  async searchJobs(query, filters = {}) {
    const boards = filters.company
      ? [filters.company.toLowerCase().replace(/\s+/g, "")]
      : this.defaultBoards;

    const perBoard = await Promise.all(boards.map((b) => this.searchBoard(b)));
    let jobs = perBoard.flat();

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

  async searchBoard(board) {
    const url = `https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`;
    logger.info(`Provider[greenhouse]: fetching board "${board}"`);

    const data = await this.fetchJSON(url, { timeout: 5000 });
    if (!data || !Array.isArray(data.jobs)) return [];

    const companyName = board.charAt(0).toUpperCase() + board.slice(1);

    return data.jobs.map((item) => {
      const locationName = item.location?.name || "";
      const description = this.cleanHTML(item.content);
      return {
        externalId: `greenhouse_${board}_${item.id}`,
        source: "greenhouse",
        title: item.title,
        company: companyName,
        logo: "",
        location: locationName,
        workMode: this.normalizeWorkMode(`${item.title} ${locationName} ${description}`),
        salaryRaw: null,
        currency: "",
        employmentType: "",
        description,
        applyUrl: item.absolute_url || "",
        postedAt: this.toDate(item.updated_at),
        tags: Array.isArray(item.departments) ? item.departments.map((d) => d.name) : [],
      };
    });
  }
}

module.exports = GreenhouseProvider;
