const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

class InstahyreProvider extends BaseJobProvider {
  constructor() {
    super("instahyre");
  }

  async searchJobs(query, filters = {}) {
    logger.info(`Provider[instahyre]: searching listings for "${query || "*"}"`);
    
    const q = (query || "").toLowerCase();
    const matches = [
      {
        title: "Senior Node.js backend developer",
        company: "Swiggy",
        logo: "https://logo.clearbit.com/swiggy.com",
        location: "Bengaluru, Karnataka, India",
        workMode: "hybrid",
        salaryRaw: 3000000,
        currency: "INR",
        employmentType: "Full-time",
        description: "Swiggy is hiring senior engineers for its core delivery logistics platform. Build backend APIs in Node.js, optimize system latency, and lead a small pod.",
        applyUrl: "https://swiggy.com/careers",
        postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        tags: ["Node.js", "Backend", "TypeScript"]
      }
    ];

    if (!q) return matches;
    return matches.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        j.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
}

module.exports = InstahyreProvider;
