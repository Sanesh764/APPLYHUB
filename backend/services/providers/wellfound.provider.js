const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

class WellfoundProvider extends BaseJobProvider {
  constructor() {
    super("wellfound");
  }

  async searchJobs(query, filters = {}) {
    logger.info(`Provider[wellfound]: searching listings for "${query || "*"}"`);
    
    const q = (query || "").toLowerCase();
    const matches = [
      {
        title: "Frontend Engineer (React / Next.js)",
        company: "Zepto",
        logo: "https://logo.clearbit.com/zepto.com",
        location: "Mumbai, Maharashtra, India",
        workMode: "onsite",
        salaryRaw: 1800000,
        currency: "INR",
        employmentType: "Full-time",
        description: "Zepto is hiring React/Next.js engineers for our consumer app web team. Work on fast load times, animations, and high-performance checkout funnels.",
        applyUrl: "https://zepto.com/careers",
        postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        tags: ["React", "Next.js", "Frontend"]
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

module.exports = WellfoundProvider;
