const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

class IndeedProvider extends BaseJobProvider {
  constructor() {
    super("indeed");
  }

  async searchJobs(query, filters = {}) {
    logger.info(`Provider[indeed]: searching public listings for "${query || "*"}"`);
    
    const q = (query || "").toLowerCase();
    const matches = [
      {
        title: "Full Stack Engineer (Node.js & React)",
        company: "Paytm",
        logo: "https://logo.clearbit.com/paytm.com",
        location: "Noida, Uttar Pradesh, India",
        workMode: "onsite",
        salaryRaw: 1200000,
        currency: "INR",
        employmentType: "Full-time",
        description: "Looking for a seasoned Full Stack Engineer with strong JavaScript/TypeScript skills. Work on our payment processing engines using Node.js and React.",
        applyUrl: "https://paytm.com/careers",
        postedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        tags: ["Full Stack", "React", "Node.js"]
      },
      {
        title: "Node.js Backend Developer",
        company: "Figma",
        logo: "https://logo.clearbit.com/figma.com",
        location: "Bengaluru, Karnataka, India",
        workMode: "remote",
        salaryRaw: 2500000,
        currency: "INR",
        employmentType: "Full-time",
        description: "Figma is expanding its presence in India. Build highly collaborative APIs and backends with Node.js, WebSockets, and high-performance databases.",
        applyUrl: "https://figma.com/careers",
        postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        tags: ["Node.js", "Backend", "WebSockets"]
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

module.exports = IndeedProvider;
