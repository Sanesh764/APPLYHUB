const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

/**
 * Lever — public postings API. Namespaced per company handle.
 *
 * Config:
 *   LEVER_BOARDS  (csv handles, default a few well-known public boards)
 */
class LeverProvider extends BaseJobProvider {
  constructor() {
    super("lever");
    this.defaultBoards = (process.env.LEVER_BOARDS || "netflix,spotify,leadiq,plaid")
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
    const url = `https://api.lever.co/v0/postings/${board}?mode=json`;
    logger.info(`Provider[lever]: fetching postings for "${board}"`);

    const data = await this.fetchJSON(url, { timeout: 5000 });
    if (!Array.isArray(data)) return [];

    const companyName = board.charAt(0).toUpperCase() + board.slice(1);

    return data.map((item) => {
      const locationName = item.categories?.location || "";
      const description = this.cleanHTML(
        `${item.descriptionPlain || ""} ${item.additionalPlain || ""}`
      );
      const commitment = item.categories?.commitment || "";
      return {
        externalId: `lever_${board}_${item.id}`,
        source: "lever",
        title: item.text,
        company: companyName,
        logo: "",
        location: locationName,
        workMode:
          item.workplaceType ||
          this.normalizeWorkMode(`${item.text} ${locationName} ${description}`),
        salaryRaw: null,
        currency: "",
        employmentType: commitment,
        description,
        applyUrl: item.hostedUrl || item.applyUrl || "",
        postedAt: this.toDate(item.createdAt),
        tags: item.categories?.team ? [item.categories.team] : [],
      };
    });
  }
}

module.exports = LeverProvider;
