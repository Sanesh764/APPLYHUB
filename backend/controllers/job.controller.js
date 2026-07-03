const Job = require("../models/Job");
const Resume = require("../models/Resume");
const jobProviderService = require("../services/jobProvider.service");
const matchingService = require("../services/matching.service");
const { sendSuccess, sendError } = require("../utils/response");
const logger = require("../config/logger");

class JobController {
  /**
   * Search jobs and calculate match percentages (Step 5)
   */
  async searchJobs(req, res, next) {
    try {
      const userId = req.user.userId;
      const { query, location, workMode, salary, experienceLevel, country } = req.query;

      // 1. Query job provider aggregator
      const rawJobs = await jobProviderService.searchJobs({
        query,
        location,
        workMode,
        salary,
        experienceLevel,
        country,
      });

      // 2. Concurrently upsert results to sync with local MongoDB and obtain ObjectIds
      const jobs = await Promise.all(
        rawJobs.map(async (job) => {
          try {
            const saved = await Job.findOneAndUpdate(
              { source: job.source, externalId: job.externalId },
              { $set: job },
              { upsert: true, new: true, runValidators: true }
            );
            return {
              ...job,
              id: saved._id.toString(),
            };
          } catch (err) {
            logger.error(`Job Controller: Failed to upsert job ${job.title}: ${err.message}`);
            return job;
          }
        })
      );

      // 3. Fetch user's active resume
      const activeResume = await Resume.findOne({ userId, isActive: true });

      if (!activeResume) {
        // If user hasn't uploaded a resume yet, return jobs with matchPercentage = null
        const results = jobs.map((job) => ({
          ...job,
          matchDetails: null,
        }));
        return sendSuccess(res, "Jobs retrieved. Upload resume to calculate match scores.", { jobs: results });
      }

      // 3. Concurrently calculate hybrid match scores for all search results
      logger.info(`Job Controller: Calculating match metrics for ${jobs.length} jobs...`);
      const matchedJobs = await Promise.all(
        jobs.map(async (job) => {
          try {
            const matchDetails = await matchingService.calculateMatch(activeResume.parsedData, job);
            return {
              ...job,
              matchPercentage: matchDetails.matchPercentage,
              matchDetails,
            };
          } catch (err) {
            logger.error(`Job Controller: Matching failed for job ${job.id}: ${err.message}`);
            return {
              ...job,
              matchPercentage: 50,
              matchDetails: {
                matchPercentage: 50,
                explanation: "Match score calculation failed due to layout formatting.",
                advantages: [],
                disadvantages: [],
                missingSkills: [],
              },
            };
          }
        })
      );

      // Sort results by match percentage descending
      matchedJobs.sort((a, b) => b.matchPercentage - a.matchPercentage);

      return sendSuccess(res, "Jobs matched and retrieved successfully.", { jobs: matchedJobs });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific Job Details & Match Breakdown
   */
  async getJobDetails(req, res, next) {
    try {
      const userId = req.user.userId;
      const { jobId } = req.params;

      const job = await Job.findById(jobId);
      if (!job) {
        return sendError(res, "Job posting not found.", 404);
      }

      // Calculate match
      const activeResume = await Resume.findOne({ userId, isActive: true });
      let matchDetails = null;
      if (activeResume) {
        matchDetails = await matchingService.calculateMatch(activeResume.parsedData, job);
      }

      return sendSuccess(res, "Job details retrieved successfully.", {
        job,
        matchDetails,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Seed Mock Jobs database (Step 5 Verification Utility)
   */
  async seedJobs(req, res, next) {
    try {
      logger.info("Job Controller: Seeding job postings database...");

      // Clear existing local mock jobs
      await Job.deleteMany({ source: "applyhub" });

      const seedJobs = [
        {
          title: "Full Stack Engineer (MERN)",
          companyName: "Google",
          companyLogo: "https://images.unsplash.com/photo-1573804633927-bfcbcd909acd?auto=format&fit=crop&w=120&h=120&q=80",
          location: "Mountain View, CA",
          workMode: "hybrid",
          salary: 140000,
          experienceLevel: "Mid-level",
          description: "We are looking for a Node.js and React developer to help build cloud applications. Experience with TypeScript, Express, and Docker is highly preferred.",
          requirements: ["React", "Node.js", "Express", "MongoDB", "TypeScript", "Docker"],
          benefits: ["Medical, Dental, Vision", "401k Matching", "Onsite lunches", "Flexible Hours"],
        },
        {
          title: "Senior React Developer",
          companyName: "Netflix",
          companyLogo: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=120&h=120&q=80",
          location: "Los Gatos, CA",
          workMode: "remote",
          salary: 195000,
          experienceLevel: "Senior",
          description: "Join our UI team to build next-generation video streaming interfaces. Expert proficiency in React, state management (Redux/Zustand), and CSS is required.",
          requirements: ["React", "TypeScript", "JavaScript", "TailwindCSS", "Redux", "Zustand"],
          benefits: ["Unlimited PTO", "Health Care Plan", "Streaming Subscriptions", "Equity Options"],
        },
        {
          title: "Backend API Specialist",
          companyName: "Stripe",
          companyLogo: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=120&h=120&q=80",
          location: "San Francisco, CA",
          workMode: "onsite",
          salary: 165000,
          experienceLevel: "Senior",
          description: "Scale core payment APIs. Candidates must have extensive experience writing high-performance Node.js code, securing express servers, and managing PostgreSQL databases.",
          requirements: ["Node.js", "Express", "PostgreSQL", "SQL", "Redis", "RESTful APIs", "Docker"],
          benefits: ["Top tier health plan", "Gym membership", "Annual learning stipend"],
        },
        {
          title: "AI Integrations Engineer",
          companyName: "OpenAI",
          companyLogo: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=120&h=120&q=80",
          location: "San Francisco, CA",
          workMode: "hybrid",
          salary: 180000,
          experienceLevel: "Senior",
          description: "Build interfaces connecting generative models to user apps. Requires strong background in Python, Node.js, prompt engineering, and database management.",
          requirements: ["Python", "JavaScript", "Node.js", "AWS", "Docker", "Git"],
          benefits: ["Free lunches", "Health benefits", "Remote work allowance", "Equity"],
        },
        {
          title: "Junior Frontend Developer",
          companyName: "WebStart Solutions",
          companyLogo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=120&h=120&q=80",
          location: "New York, NY",
          workMode: "onsite",
          salary: 75000,
          experienceLevel: "Entry",
          description: "Great entry level role! Assist in coding responsive landing pages using HTML, CSS, JavaScript, and React.",
          requirements: ["HTML", "CSS", "JavaScript", "React", "Git"],
          benefits: ["15 days PTO", "Medical Plan", "Weekly Happy Hours"],
        },
      ];

      const jobs = await Job.create(seedJobs);

      return sendSuccess(res, "Mock jobs database seeded successfully.", { count: jobs.length });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new JobController();
