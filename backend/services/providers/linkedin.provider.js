const BaseJobProvider = require("./base.provider");
const logger = require("../../config/logger");

class LinkedInProvider extends BaseJobProvider {
  constructor() {
    super("linkedin");
  }

  async searchJobs(query, filters = {}) {
    logger.info(`Provider[linkedin]: searching public listings for "${query || "*"}"`);
    
    // In production, this would call a LinkedIn public scraping service or public RSS feed.
    // For local preview, we return a high-quality mock representation to populate the dashboard.
    const q = (query || "").toLowerCase();
    const matches = [
      {
        title: "Senior React Developer",
        company: "Google India",
        logo: "https://logo.clearbit.com/google.com",
        location: "Bengaluru, Karnataka, India",
        workMode: "hybrid",
        salaryRaw: 1800000,
        currency: "INR",
        employmentType: "Full-time",
        description: "We are looking for a Senior React Developer to join our Cloud Console team. Experience with TypeScript, React, and state management is required.",
        applyUrl: "https://careers.google.com",
        postedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        tags: ["React", "TypeScript", "Frontend"]
      },
      {
        title: "Software Engineer - MERN Stack",
        company: "Stripe",
        logo: "https://logo.clearbit.com/stripe.com",
        location: "Mumbai, Maharashtra, India",
        workMode: "remote",
        salaryRaw: 2200000,
        currency: "INR",
        employmentType: "Full-time",
        description: "Join Stripe's payment gateway team in India. Work on scalable Node.js and React microservices. Deep knowledge of Mongo and Redis is a plus.",
        applyUrl: "https://stripe.com/jobs",
        postedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        tags: ["MERN", "React", "Node.js", "MongoDB"]
      },
      {
        title: "Frontend Developer Internship",
        company: "Razorpay",
        logo: "https://logo.clearbit.com/razorpay.com",
        location: "Bengaluru, Karnataka, India",
        workMode: "onsite",
        salaryRaw: 350000,
        currency: "INR",
        employmentType: "Internship",
        description: "Razorpay is hiring Frontend Interns. Gain experience with React, TailwindCSS, and modern frontend tools. PPO opportunities available based on performance.",
        applyUrl: "https://razorpay.com/careers",
        postedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        tags: ["React", "Internship", "HTML", "CSS"]
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

module.exports = LinkedInProvider;
