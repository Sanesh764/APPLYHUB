const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

class FounditProvider extends BaseJobProvider {
  constructor() {
    super("foundit");
  }

  async searchJobs(query, filters = {}) {
    logger.info(`Provider[foundit]: searching listings for "${query || "*"}"`);
    
    const q = (query || "").toLowerCase();
    const matches = [
      {
        title: "Frontend Developer (React / TypeScript)",
        company: "TCS",
        logo: "https://logo.clearbit.com/tcs.com",
        location: "Hyderabad, Telangana, India",
        workMode: "onsite",
        salaryRaw: 700000,
        currency: "INR",
        employmentType: "Full-time",
        description: "TCS is hiring Frontend Developers. Experience in React, TypeScript, and modern state management. Ability to write responsive web components is key.",
        applyUrl: "https://tcs.com/careers",
        postedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        tags: ["React", "TypeScript", "Frontend"]
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

module.exports = FounditProvider;
