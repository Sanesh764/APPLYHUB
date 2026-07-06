const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

class YCJobsProvider extends BaseJobProvider {
  constructor() {
    super("ycjobs");
  }

  async searchJobs(query, filters = {}) {
    logger.info(`Provider[ycjobs]: searching listings for "${query || "*"}"`);
    
    const q = (query || "").toLowerCase();
    const matches = [
      {
        title: "AI Engineer (LLMs & RAG)",
        company: "Krutrim AI",
        logo: "https://logo.clearbit.com/ola.com",
        location: "Bengaluru, Karnataka, India",
        workMode: "onsite",
        salaryRaw: 3500000,
        currency: "INR",
        employmentType: "Full-time",
        description: "Join Krutrim to build India's own foundational AI models. Work on context windows, fine-tuning, RAG pipelines, and model optimizations.",
        applyUrl: "https://krutrim.com",
        postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        tags: ["AI", "LLM", "RAG", "Python"]
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

module.exports = YCJobsProvider;
