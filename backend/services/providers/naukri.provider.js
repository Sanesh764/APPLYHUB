const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

class NaukriProvider extends BaseJobProvider {
  constructor() {
    super("naukri");
  }

  async searchJobs(query, filters = {}) {
    logger.info(`Provider[naukri]: searching listings for "${query || "*"}"`);
    
    const q = (query || "").toLowerCase();
    const matches = [
      {
        title: "React Developer",
        company: "Infosys",
        logo: "https://logo.clearbit.com/infosys.com",
        location: "Pune, Maharashtra, India",
        workMode: "hybrid",
        salaryRaw: 800000,
        currency: "INR",
        employmentType: "Full-time",
        description: "Join Infosys as a React Developer. You will build user-facing features, optimize frontend rendering, and integrate RESTful APIs. Experience with Redux is a plus.",
        applyUrl: "https://career.infosys.com",
        postedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        tags: ["React", "Redux", "Frontend"]
      },
      {
        title: "MERN Stack Developer (Freshers)",
        company: "Wipro",
        logo: "https://logo.clearbit.com/wipro.com",
        location: "Chennai, Tamil Nadu, India",
        workMode: "onsite",
        salaryRaw: 450000,
        currency: "INR",
        employmentType: "Full-time",
        description: "Wipro is seeking fresher MERN Stack Developers. Training will be provided. Strong foundation in JavaScript, HTML, CSS, React, and Node.js is required.",
        applyUrl: "https://careers.wipro.com",
        postedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
        tags: ["MERN", "React", "Node.js", "Fresher"]
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

module.exports = NaukriProvider;
