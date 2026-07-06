const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

class CutshortProvider extends BaseJobProvider {
  constructor() {
    super("cutshort");
  }

  async searchJobs(query, filters = {}) {
    logger.info(`Provider[cutshort]: searching listings for "${query || "*"}"`);
    
    const q = (query || "").toLowerCase();
    const matches = [
      {
        title: "Node.js Developer (Express/NestJS)",
        company: "Zomato",
        logo: "https://logo.clearbit.com/zomato.com",
        location: "Gurugram, Haryana, India",
        workMode: "hybrid",
        salaryRaw: 1600000,
        currency: "INR",
        employmentType: "Full-time",
        description: "Join Zomato's backend platform team. Design fast, scalable microservices in Node.js and NestJS. Experience with PostgreSQL and high-throughput Kafka is required.",
        applyUrl: "https://zomato.com/careers",
        postedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        tags: ["Node.js", "NestJS", "Backend", "PostgreSQL"]
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

module.exports = CutshortProvider;
