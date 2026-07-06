const Job = require("../models/Job");
const Resume = require("../models/Resume");
const jobAggregator = require("../services/jobAggregator.service");
const matchingService = require("../services/matching.service");
const aiAnalysisService = require("../services/aiAnalysis.service");
const aiService = require("../services/ai.service");
const cacheService = require("../services/cache.service");
const countryService = require("../services/country.service");
const { sendSuccess } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");
const { NotFoundError } = require("../utils/errors");
const logger = require("../config/logger");

// How long a live provider search is served from memory before re-fetching.
const SEARCH_CACHE_TTL = 600; // 10 minutes
// How long a per-user job match is cached (avoids repeat LLM calls).
const MATCH_CACHE_TTL = 1800; // 30 minutes
// Cap on jobs scored for the "recommended" pool to bound AI cost.
const RECOMMEND_POOL = 40;

class JobController {
  // ===========================================================================
  //  Public endpoints
  // ===========================================================================

  /**
   * GET /search — live aggregate across providers, cached in Mongo, paginated.
   * The heavy AI work (summary + resume match) runs only for the returned page.
   */
  searchJobs = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const filters = this.parseFilters(req.query);
    const { page, limit } = this.parsePagination(req.query);

    // 1. Serve the aggregated+persisted id list from memory when warm.
    const cacheKey = `search_${JSON.stringify(filters)}_${userId}`;
    let jobIds = cacheService.get(cacheKey);

    if (!jobIds) {
      const enriched = await jobAggregator.search(filters.query, filters, userId);
      const saved = await this.persistJobs(enriched);
      jobIds = saved.map((d) => d._id.toString());
      cacheService.set(cacheKey, jobIds, SEARCH_CACHE_TTL);
    }

    // 2. Paginate the ranked id list, then do heavy AI work for the page only.
    const total = jobIds.length;
    const pageIds = jobIds.slice((page - 1) * limit, page * limit);
    const jobDocs = await this.loadInOrder(pageIds);

    await this.ensureSummaries(jobDocs);
    const withMatches = await this.attachMatches(jobDocs, userId);

    return sendSuccess(res, "Jobs aggregated and matched successfully.", {
      jobs: withMatches.map(({ doc, match }) => this.formatJob(doc, match)),
      pagination: this.pageMeta(page, limit, total),
    });
  });

  /** GET / — list cached jobs from Mongo with filters, paginated. */
  getJobs = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const filters = this.parseFilters(req.query);
    const { page, limit } = this.parsePagination(req.query);

    const mongoQuery = this.buildMongoQuery(filters);
    const total = await Job.countDocuments(mongoQuery);
    const jobDocs = await Job.find(mongoQuery)
      .sort({ postedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    await this.ensureSummaries(jobDocs);
    const withMatches = await this.attachMatches(jobDocs, userId);

    return sendSuccess(res, "Cached jobs retrieved successfully.", {
      jobs: withMatches.map(({ doc, match }) => this.formatJob(doc, match)),
      pagination: this.pageMeta(page, limit, total),
    });
  });

  /**
   * GET /recommended — cached jobs scored against the active resume, best first.
   */
  getRecommended = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { page, limit } = this.parsePagination(req.query);

    const resume = await Resume.findOne({ userId, isActive: true });
    if (!resume) {
      return sendSuccess(res, "Upload a resume to get personalized recommendations.", {
        jobs: [],
        pagination: this.pageMeta(page, limit, 0),
      });
    }

    const pool = await Job.find({}).sort({ postedAt: -1 }).limit(RECOMMEND_POOL);
    logger.info(`Job Controller: scoring ${pool.length} jobs for recommendations (cap ${RECOMMEND_POOL}).`);

    const scored = await Promise.all(
      pool.map(async (doc) => ({ doc, match: await this.getMatchForJob(userId, resume, doc) }))
    );
    scored.sort((a, b) => (b.match?.matchScore || 0) - (a.match?.matchScore || 0));

    const total = scored.length;
    const pageItems = scored.slice((page - 1) * limit, page * limit);
    const pageDocs = pageItems.map((s) => s.doc);
    
    await this.ensureSummaries(pageDocs);

    return sendSuccess(res, "Recommended jobs retrieved successfully.", {
      jobs: pageItems.map(({ doc, match }) => this.formatJob(doc, match)),
      pagination: this.pageMeta(page, limit, total),
    });
  });

  /** GET /trending — most recent postings across sources. */
  getTrending = asyncHandler(async (req, res) => {
    const { page, limit } = this.parsePagination(req.query);
    const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const query = { postedAt: { $gte: cutoff } };
    const total = await Job.countDocuments(query);
    const jobDocs = await Job.find(query)
      .sort({ postedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const withMatches = await this.attachMatches(jobDocs, req.user.userId);
    return sendSuccess(res, "Trending jobs retrieved successfully.", {
      jobs: withMatches.map(({ doc, match }) => this.formatJob(doc, match)),
      pagination: this.pageMeta(page, limit, total),
    });
  });

  /** GET /remote — remote-only listings. */
  getRemoteJobs = asyncHandler(async (req, res) => {
    const { page, limit } = this.parsePagination(req.query);
    const query = { remoteType: "remote" };
    const total = await Job.countDocuments(query);
    const jobDocs = await Job.find(query)
      .sort({ postedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const withMatches = await this.attachMatches(jobDocs, req.user.userId);
    return sendSuccess(res, "Remote jobs retrieved successfully.", {
      jobs: withMatches.map(({ doc, match }) => this.formatJob(doc, match)),
      pagination: this.pageMeta(page, limit, total),
    });
  });

  /** GET /salary — jobs with a known salary, highest first. */
  getSalaryJobs = asyncHandler(async (req, res) => {
    const { page, limit } = this.parsePagination(req.query);
    const query = { $or: [{ salaryMin: { $ne: null } }, { salaryMax: { $ne: null } }] };
    const total = await Job.countDocuments(query);
    const jobDocs = await Job.find(query)
      .sort({ salaryMax: -1, salaryMin: -1, postedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const withMatches = await this.attachMatches(jobDocs, req.user.userId);
    return sendSuccess(res, "Jobs with salary details retrieved successfully.", {
      jobs: withMatches.map(({ doc, match }) => this.formatJob(doc, match)),
      pagination: this.pageMeta(page, limit, total),
    });
  });

  /** GET /company/:company — jobs from a specific company. */
  getJobsByCompany = asyncHandler(async (req, res) => {
    const { company } = req.params;
    const { page, limit } = this.parsePagination(req.query);
    const query = { company: new RegExp(this.escapeRegExp(company), "i") };

    const total = await Job.countDocuments(query);
    const jobDocs = await Job.find(query)
      .sort({ postedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const withMatches = await this.attachMatches(jobDocs, req.user.userId);
    return sendSuccess(res, `Jobs at ${company} retrieved successfully.`, {
      jobs: withMatches.map(({ doc, match }) => this.formatJob(doc, match)),
      pagination: this.pageMeta(page, limit, total),
    });
  });

  /** GET /:jobId — full details, AI enrichment and match breakdown. */
  getJobDetails = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) throw new NotFoundError("Job posting not found.");

    await this.ensureSummaries([job]);

    const resume = await Resume.findOne({ userId, isActive: true });
    let match = null;
    let aiAnalysis = null;
    if (resume) {
      match = await this.getMatchForJob(userId, resume, job);
      aiAnalysis = await aiAnalysisService
        .getOrCreateAnalysis(userId, resume, job)
        .catch((err) => {
          logger.warn(`Job Controller: analysis compile failed for ${jobId}: ${err.message}`);
          return null;
        });
    }

    return sendSuccess(res, "Job details retrieved successfully.", {
      job: this.formatJob(job, match),
      aiAnalysis,
    });
  });

  /** GET /providers/health — per-provider diagnostics. */
  getProvidersHealth = asyncHandler(async (req, res) => {
    const health = await jobAggregator.healthCheck();
    const healthy = health.filter((h) => h.status === "healthy").length;
    return sendSuccess(res, "Provider health check completed.", {
      providers: health,
      healthy,
      total: health.length,
      status: healthy > 0 ? "healthy" : "unhealthy",
    });
  });

  // ===========================================================================
  //  Internal helpers
  // ===========================================================================

  /** Normalize raw query params into the aggregator's filter shape. */
  parseFilters(q = {}) {
    const remoteType = q.remoteType || q.workMode;
    return {
      query: (q.query || q.keyword || "").trim(),
      location: q.location || "",
      company: q.company || "",
      remoteType: remoteType && remoteType !== "any" ? remoteType : "",
      employmentType: q.employmentType || "",
      experience: q.experience || "",
      salary: q.salary || "",
      skills: q.skills || "",
      postedWithin: q.postedWithin || "",
      matchScore: q.matchScore || "",
      country: q.country || "India",
    };
  }

  parsePagination(q = {}) {
    const page = Math.max(1, parseInt(q.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(q.limit, 10) || 12));
    return { page, limit };
  }

  pageMeta(page, limit, total) {
    const totalPages = Math.max(1, Math.ceil(total / limit));
    return { page, limit, total, totalPages, hasMore: page < totalPages };
  }

  /** Translate filters into a Mongo query for cache-backed list endpoints. */
  buildMongoQuery(filters) {
    const query = {};
    if (filters.query) {
      const re = new RegExp(this.escapeRegExp(filters.query), "i");
      query.$or = [{ title: re }, { description: re }, { skills: re }];
    }
    if (filters.location) query.location = new RegExp(this.escapeRegExp(filters.location), "i");
    if (filters.company) query.company = new RegExp(this.escapeRegExp(filters.company), "i");
    if (filters.remoteType) query.remoteType = filters.remoteType;
    if (filters.employmentType) query.employmentType = new RegExp(this.escapeRegExp(filters.employmentType), "i");
    if (filters.salary) query.salaryMax = { $gte: Number(filters.salary) || 0 };
    if (filters.postedWithin) {
      const days = Number(filters.postedWithin);
      if (days > 0) query.postedAt = { $gte: new Date(Date.now() - days * 86400000) };
    }
    if (filters.skills) {
      const arr = filters.skills.split(",").map((s) => s.trim()).filter(Boolean);
      if (arr.length) query.skills = { $in: arr.map((s) => new RegExp(this.escapeRegExp(s), "i")) };
    }

    // Country filtering (Requirement 1)
    const targetCountry = filters.country || "India";
    const data = countryService.getCountryData(targetCountry);
    const countryRegexes = [
      ...data.tokens.map(t => new RegExp(this.escapeRegExp(t), "i")),
      ...data.cities.map(c => new RegExp(this.escapeRegExp(c), "i")),
      ...data.states.map(s => new RegExp(this.escapeRegExp(s), "i")),
    ];

    if (query.$or) {
      // Merge with existing title/desc $or query
      query.$and = [
        { $or: query.$or },
        {
          $or: [
            { location: { $in: countryRegexes } },
            { location: /remote/i }
          ]
        }
      ];
      delete query.$or;
    } else {
      query.$or = [
        { location: { $in: countryRegexes } },
        { location: /remote/i }
      ];
    }

    return query;
  }

  /**
   * Upsert enriched jobs into the Mongo cache (one canonical record per
   * source+externalId). Never overwrites AI fields.
   */
  async persistJobs(enrichedJobs) {
    const docs = await Promise.all(
      enrichedJobs.map(async (job) => {
        try {
          // Exclude AI-owned fields from scraper upsert
          const {
            summary, preferredSkills, responsibilities,
            companyWebsite, companySize, companyIndustry, companyDescription,
            benefits, visaSponsorship, indiaEligible, isInternship, internshipDetails,
            ...persistable
          } = job;

          return await Job.findOneAndUpdate(
            { source: job.source, externalId: job.externalId },
            { $set: { ...persistable, lastFetchedAt: new Date() } },
            { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
          );
        } catch (err) {
          logger.error(`Job Controller: upsert failed for "${job.title}": ${err.message}`);
          return null;
        }
      })
    );
    return docs.filter(Boolean);
  }

  /** Load job docs preserving the order of the given id list. */
  async loadInOrder(ids) {
    if (!ids.length) return [];
    const docs = await Job.find({ _id: { $in: ids } });
    const byId = new Map(docs.map((d) => [d._id.toString(), d]));
    return ids.map((id) => byId.get(id)).filter(Boolean);
  }

  /**
   * Lazily generate + persist AI summaries for jobs that lack one.
   */
  async ensureSummaries(jobDocs) {
    await Promise.all(
      jobDocs.map(async (doc) => {
        if (doc.summary && doc.summary.trim() && doc.aiEnrichedAt) return;
        try {
          const enrich = await aiService.summarizeJob(doc.toObject ? doc.toObject() : doc);
          
          doc.summary = enrich.summary || doc.summary;
          if (Array.isArray(enrich.preferredSkills) && enrich.preferredSkills.length) {
            doc.preferredSkills = enrich.preferredSkills;
          }
          if (Array.isArray(enrich.responsibilities) && enrich.responsibilities.length) {
            doc.responsibilities = enrich.responsibilities;
          }
          
          doc.companyWebsite = enrich.companyWebsite || doc.companyWebsite;
          doc.companySize = enrich.companySize || doc.companySize;
          doc.companyIndustry = enrich.companyIndustry || doc.companyIndustry;
          doc.companyDescription = enrich.companyDescription || doc.companyDescription;

          if (Array.isArray(enrich.benefits) && enrich.benefits.length) {
            doc.benefits = enrich.benefits;
          }
          doc.visaSponsorship = enrich.visaSponsorship || doc.visaSponsorship;
          doc.indiaEligible = enrich.indiaEligible || doc.indiaEligible;
          doc.isInternship = enrich.isInternship !== undefined ? enrich.isInternship : doc.isInternship;

          if (enrich.internshipDetails) {
            doc.internshipDetails = {
              stipend: enrich.internshipDetails.stipend || doc.internshipDetails?.stipend || "Not Disclosed",
              duration: enrich.internshipDetails.duration || doc.internshipDetails?.duration || "Not Disclosed",
              internshipType: enrich.internshipDetails.internshipType || doc.internshipDetails?.internshipType || "Not Disclosed",
              ppoAvailability: enrich.internshipDetails.ppoAvailability || doc.internshipDetails?.ppoAvailability || "Not Disclosed",
              startDate: enrich.internshipDetails.startDate || doc.internshipDetails?.startDate || "Not Disclosed",
              eligibility: enrich.internshipDetails.eligibility || doc.internshipDetails?.eligibility || "Not Disclosed"
            };
          }

          doc.aiEnrichedAt = new Date();
          
          await Job.updateOne(
            { _id: doc._id },
            {
              $set: {
                summary: doc.summary,
                preferredSkills: doc.preferredSkills,
                responsibilities: doc.responsibilities,
                companyWebsite: doc.companyWebsite,
                companySize: doc.companySize,
                companyIndustry: doc.companyIndustry,
                companyDescription: doc.companyDescription,
                benefits: doc.benefits,
                visaSponsorship: doc.visaSponsorship,
                indiaEligible: doc.indiaEligible,
                isInternship: doc.isInternship,
                internshipDetails: doc.internshipDetails,
                aiEnrichedAt: doc.aiEnrichedAt,
              },
            }
          );
        } catch (err) {
          logger.warn(`Job Controller: summary generation failed for ${doc._id}: ${err.message}`);
        }
      })
    );
  }

  /** Attach a resume match to each job (or null when no active resume). */
  async attachMatches(jobDocs, userId) {
    const resume = await Resume.findOne({ userId, isActive: true });
    if (!resume) return jobDocs.map((doc) => ({ doc, match: null }));

    return Promise.all(
      jobDocs.map(async (doc) => ({ doc, match: await this.getMatchForJob(userId, resume, doc) }))
    );
  }

  /** Compute or read a cached per-user match for a single job. */
  async getMatchForJob(userId, resume, jobDoc) {
    const key = `match_${userId}_${resume.version || 1}_${jobDoc._id}`;
    const cached = cacheService.get(key);
    if (cached) return cached;

    try {
      const m = await matchingService.calculateMatch(resume.parsedData, jobDoc);
      const match = {
        matchScore: m.matchPercentage,
        matchingSkills: m.matchingSkills || [],
        missingSkills: m.missingSkills || [],
        why: m.why || m.explanation || "",
        recommendation: m.recommendation || "",
        resumeSuggestions: m.resumeSuggestions || [],
        interviewReadiness: m.interviewReadiness || "Not Specified",
        difficultyLevel: m.difficultyLevel || "Not Specified",
        interviewTopics: m.interviewTopics || [],
        prepRoadmap: m.prepRoadmap || [],
        learningResources: m.learningResources || [],
      };
      cacheService.set(key, match, MATCH_CACHE_TTL);
      return match;
    } catch (err) {
      logger.error(`Job Controller: match failed for ${jobDoc._id}: ${err.message}`);
      return {
        matchScore: null,
        matchingSkills: [],
        missingSkills: [],
        why: "",
        recommendation: "",
        resumeSuggestions: [],
        interviewReadiness: "Not Specified",
        difficultyLevel: "Not Specified",
        interviewTopics: [],
        prepRoadmap: [],
        learningResources: [],
      };
    }
  }

  /** Shape a job document + optional match into the API response object. */
  formatJob(doc, match) {
    const j = doc.toObject ? doc.toObject() : doc;
    return {
      id: j._id.toString(),
      title: j.title,
      company: j.company,
      logo: j.logo,
      location: j.location,
      remoteType: j.remoteType,
      employmentType: j.employmentType,
      experience: j.experience,
      salary: j.salary,
      salaryMin: j.salaryMin,
      salaryMax: j.salaryMax,
      currency: j.currency,
      skills: j.skills,
      preferredSkills: j.preferredSkills,
      technologies: j.technologies,
      education: j.education,
      responsibilities: j.responsibilities,
      summary: j.summary,
      description: j.description,
      postedAt: j.postedAt,
      applyUrl: j.applyUrl,
      source: j.source,
      
      // Company Info (Requirement 5)
      companyWebsite: j.companyWebsite || "Not Specified",
      companySize: j.companySize || "Not Specified",
      companyIndustry: j.companyIndustry || "Not Specified",
      companyDescription: j.companyDescription || "Not Specified",

      // Benefits & Visa (Requirement 3)
      benefits: j.benefits || [],
      visaSponsorship: j.visaSponsorship || "Not Specified",
      indiaEligible: j.indiaEligible || "Not Specified",

      // Internship details (Requirement 11)
      isInternship: j.isInternship || false,
      internshipDetails: j.internshipDetails || {
        stipend: "Not Disclosed",
        duration: "Not Disclosed",
        internshipType: "Not Disclosed",
        ppoAvailability: "Not Disclosed",
        startDate: "Not Disclosed",
        eligibility: "Not Disclosed"
      },

      // Per-user match signals (Requirement 4)
      matchScore: match ? match.matchScore : null,
      matchingSkills: match ? match.matchingSkills : [],
      missingSkills: match ? match.missingSkills : [],
      why: match ? match.why : "",
      recommendation: match ? match.recommendation : "",
      
      // Extended match signals (Requirements 4 & 10)
      resumeSuggestions: match ? match.resumeSuggestions : [],
      interviewReadiness: match ? match.interviewReadiness : "Not Specified",
      difficultyLevel: match ? match.difficultyLevel : "Not Specified",
      interviewTopics: match ? match.interviewTopics : [],
      prepRoadmap: match ? match.prepRoadmap : [],
      learningResources: match ? match.learningResources : [],
    };
  }

  escapeRegExp(string) {
    return (string || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

module.exports = new JobController();
