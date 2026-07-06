const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

/**
 * Ashby — public job-board posting API. Namespaced per job-board name.
 *
 * Config:
 *   ASHBY_BOARDS  (csv job-board names, default a few public ones)
 */
class AshbyProvider extends BaseJobProvider {
  constructor() {
    super("ashby");
    this.defaultBoards = (process.env.ASHBY_BOARDS || "Ramp,Linear,Notion")
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean);
  }

  async searchJobs(query, filters = {}) {
    const boards = filters.company ? [filters.company] : this.defaultBoards;
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
    const url = `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(
      board
    )}?includeCompensation=true`;
    logger.info(`Provider[ashby]: fetching job board "${board}"`);

    const data = await this.fetchJSON(url, { timeout: 5000 });
    if (!data || !Array.isArray(data.jobs)) return [];

    return data.jobs.map((item) => {
      const description = this.cleanHTML(item.descriptionPlain || item.descriptionHtml || "");
      const comp = item.compensation?.compensationTierSummary || "";
      return {
        externalId: `ashby_${board}_${item.id}`,
        source: "ashby",
        title: item.title,
        company: board,
        logo: "",
        location: item.isRemote ? "Remote" : item.location || "",
        workMode: item.isRemote
          ? "remote"
          : this.normalizeWorkMode(`${item.title} ${item.location || ""}`),
        salaryRaw: comp || null,
        currency: "",
        employmentType: item.employmentType || "",
        description,
        applyUrl: item.applyUrl || item.jobUrl || "",
        postedAt: this.toDate(item.publishedAt),
        tags: [item.department, item.team].filter(Boolean),
      };
    });
  }
}

module.exports = AshbyProvider;
