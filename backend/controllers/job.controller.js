const Job = require("../models/Job");
const Resume = require("../models/Resume");
const AIAnalysis = require("../models/AIAnalysis");
const jobProviderService = require("../services/jobProvider.service");
const matchingService = require("../services/matching.service");
const aiAnalysisService = require("../services/aiAnalysis.service");
const cacheService = require("../services/cache.service");
const { sendSuccess } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");
const { NotFoundError } = require("../utils/errors");
const logger = require("../config/logger");

class JobController {
  /**
   * Search jobs and calculate match percentages (Step 5)
   */
  searchJobs = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const {
      query,
      location,
      workMode,
      salary,
      experienceLevel,
      country,
      state,
      city,
      company,
      jobType,
      sortBy
    } = req.query;

    // 1. Query memory cache representation
    const cacheKey = `search_${userId || "public"}_${query || ""}_${location || ""}_${workMode || ""}_${salary || ""}_${experienceLevel || ""}_${state || ""}_${city || ""}_${company || ""}_${jobType || ""}_${sortBy || ""}`;
    const cachedData = cacheService.get(cacheKey);
    if (cachedData) {
      logger.info(`Job Controller: Returning cached search results for key ${cacheKey}`);
      return sendSuccess(res, "Jobs matched and retrieved successfully (cache hit).", { jobs: cachedData });
    }

    // 2. Query job provider aggregator
    const rawJobs = await jobProviderService.searchJobs({
      query,
      location,
      workMode,
      salary,
      experienceLevel,
      country,
      state,
      city,
      company,
      jobType,
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
          // Best-effort sync; a single upsert failure must not fail the search.
          logger.error(`Job Controller: Failed to upsert job ${job.title}: ${err.message}`);
          return job;
        }
      })
    );

    // 3. Fetch user's active resume
    const activeResume = await Resume.findOne({ userId, isActive: true });
    const resumeVersion = activeResume ? activeResume.version : 1;

    if (!activeResume) {
      // If user hasn't uploaded a resume yet, return jobs with matchPercentage = null
      const results = jobs.map((job) => ({
        ...job,
        matchDetails: null,
      }));
      return sendSuccess(res, "Jobs retrieved. Upload resume to calculate match scores.", { jobs: results });
    }

    // 4. Concurrently calculate hybrid match scores for all search results
    logger.info(`Job Controller: Calculating match metrics for ${jobs.length} jobs...`);
    const matchedJobs = await Promise.all(
      jobs.map(async (job) => {
        try {
          // Check if full AI Analysis is already cached in MongoDB
          const cached = await AIAnalysis.findOne({
            userId,
            resumeVersion,
            jobId: job.id || job._id,
          });

          if (cached) {
            return {
              ...job,
              matchPercentage: cached.matchScore,
              aiAnalysis: cached,
            };
          }

          const matchDetails = await matchingService.calculateMatch(activeResume.parsedData, job);
          return {
            ...job,
            matchPercentage: matchDetails.matchPercentage,
            matchDetails,
          };
        } catch (err) {
          // Per-job scoring is best-effort; fall back to a neutral score.
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

    // Sort results by AI Match Score or Posted Date
    const sortType = sortBy || "match";
    if (sortType === "date" || sortType === "postedDate") {
      matchedJobs.sort((a, b) => new Date(b.postedDate) - new Date(a.postedDate));
    } else {
      matchedJobs.sort((a, b) => b.matchPercentage - a.matchPercentage);
    }

    // Cache search results for 10 minutes (600 seconds)
    cacheService.set(cacheKey, matchedJobs, 600);

    return sendSuccess(res, "Jobs matched and retrieved successfully.", { jobs: matchedJobs });
  });

  /**
   * Diagnostic provider health check (Requirement 11).
   * Always returns the standard envelope; the probe result lives under `data`.
   * Never leaks raw upstream error details to the client.
   */
  getProvidersHealth = asyncHandler(async (req, res) => {
    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;

    if (!appId || !appKey) {
      return sendSuccess(res, "Provider health check completed.", {
        adzuna: "missing_credentials",
        country: "India",
        jobsFound: 0,
        status: "unhealthy",
      });
    }

    const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${appId}&app_key=${appKey}&results_per_page=1`;

    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return sendSuccess(res, "Provider health check completed.", {
          adzuna: `failed_with_status_${response.status}`,
          country: "India",
          jobsFound: 0,
          status: "unhealthy",
        });
      }

      const data = await response.json();
      const count = data.count || 0;

      return sendSuccess(res, "Provider health check completed.", {
        adzuna: "connected",
        country: "India",
        jobsFound: count,
        status: "healthy",
      });
    } catch (error) {
      // Log details server-side only; report a clean unhealthy status to the client.
      logger.error("Job Controller: Providers health check failed", { error: error.message });
      return sendSuccess(res, "Provider health check completed.", {
        adzuna: "error",
        country: "India",
        jobsFound: 0,
        status: "unhealthy",
      });
    }
  });

  /**
   * Get specific Job Details & Match Breakdown
   */
  getJobDetails = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      throw new NotFoundError("Job posting not found.");
    }

    // Calculate or retrieve cached AI Analysis features
    const activeResume = await Resume.findOne({ userId, isActive: true });
    let aiAnalysis = null;
    if (activeResume) {
      aiAnalysis = await aiAnalysisService.getOrCreateAnalysis(userId, activeResume, job);
    }

    return sendSuccess(res, "Job details retrieved successfully.", {
      job,
      aiAnalysis,
    });
  });

  /**
   * Seed Mock Jobs database (Step 5 Verification Utility)
   */
  seedJobs = asyncHandler(async (req, res) => {
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
  });
}

module.exports = new JobController();
