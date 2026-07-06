

const AIAnalysis = require("../models/AIAnalysis");
const aiService = require("./ai.service");
const matchingService = require("./matching.service");
const logger = require("../config/logger");

class AIAnalysisService {
  /**
   * Resolves or generates the comprehensive AI metrics for a candidate-job pair.
   * Leverages MongoDB cache to prevent redundant LLM invocations.
   */
  async getOrCreateAnalysis(userId, activeResume, job) {
    const resumeVersion = activeResume.version || 1;
    const jobId = job.id || job._id;

    try {
      // 1. Check database cache
      const cached = await AIAnalysis.findOne({ userId, resumeVersion, jobId });
      if (cached) {
        logger.info(`AI Analysis Service: Cache HIT for user:${userId} job:${jobId}`);
        return cached;
      }

      logger.info(`AI Analysis Service: Cache MISS for user:${userId} job:${jobId}. Compiling features in parallel...`);
      const startTime = Date.now();

      // 2. Run parallel AI calls and match scorers using Promise.all()
      const [matchScoreDetails, atsDetails, coverLetter, lightweightMetrics] = await Promise.all([
        // Scorer 1: Hybrid matching and skill alignments
        matchingService.calculateMatch(activeResume.parsedData, job).catch(err => {
          logger.warn(`Scorer 1 failed: ${err.message}`);
          return { matchPercentage: 60, missingSkills: [], requiredSkills: [] };
        }),
        // Scorer 2: ATS formatting and suggestions
        aiService.analyzeATS(activeResume.parsedData, job.title).catch(err => {
          logger.warn(`Scorer 2 failed: ${err.message}`);
          return { atsScore: 65, improvementSuggestions: [] };
        }),
        // Scorer 3: Pre-compiled cover letter
        aiService.generateCoverLetter(
          activeResume.parsedData,
          job.companyName,
          job.title,
          job.description
        ).catch(err => {
          logger.warn(`Cover Letter compilation failed: ${err.message}`);
          return "Cover letter preparation failed. Please edit manually.";
        }),
        // Scorer 4: Salary, insights, probabilities
        this.fetchLightweightMetrics(activeResume.parsedData, job).catch(err => {
          logger.warn(`Lightweight metrics failed: ${err.message}`);
          return { successProbability: 50, interviewProbability: 50, summary: "Matches basic role parameters." };
        })
      ]);

      // 3. Persist the compiled analysis to database cache
      const analysis = await AIAnalysis.create({
        userId,
        resumeVersion,
        jobId,
        matchScore: matchScoreDetails.matchPercentage || 50,
        atsCompatibility: atsDetails.atsScore || 65,
        missingSkills: matchScoreDetails.missingSkills || [],
        requiredSkills: job.requirements || [],
        resumeSuggestions: atsDetails.improvementSuggestions || [],
        personalizedCoverLetter: coverLetter,
        aiSummary: lightweightMetrics.summary || "Matches candidate profile.",
        applicationSuccessProbability: lightweightMetrics.successProbability || 50,
        interviewProbability: lightweightMetrics.interviewProbability || 50,
      });

      const totalDuration = Date.now() - startTime;
      logger.info(`AI Analysis Service: Features successfully generated in ${totalDuration}ms for job:${jobId}`);

      return analysis;
    } catch (error) {
      logger.error(`AI Analysis Service: Failed to compile features for job:${jobId}: ${error.message}`);
      // Return a structured default object instead of crashing the search pipeline
      return {
        matchScore: 50,
        atsCompatibility: 50,
        missingSkills: [],
        requiredSkills: job.requirements || [],
        resumeSuggestions: [],
        personalizedCoverLetter: "Prepared package. Ready to copy details.",
        aiSummary: "No summary available due to layout parsing constraints.",
        applicationSuccessProbability: 50,
        interviewProbability: 50,
      };
    }
  }

  /**
   * Helper to fetch auxiliary matching probabilities, salary, and company insights
   */
  async fetchLightweightMetrics(parsedData, job) {
    const systemPrompt = `You are a corporate recruiter. Analyze this resume against the job details and output JSON strictly conforming to this schema:
    {
      "successProbability": 85,
      "interviewProbability": 75,
      "summary": "1-2 sentence AI summary explaining why this candidate fits this job role."
    }`;

    const prompt = `Resume: ${JSON.stringify(parsedData)}\nJob Title: ${job.title}\nCompany: ${job.companyName}\nDescription: ${job.description}`;
    return await aiService.execute("queryLLM", prompt, systemPrompt);
  }
}

module.exports = new AIAnalysisService();
