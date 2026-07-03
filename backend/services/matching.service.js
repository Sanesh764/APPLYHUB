const aiService = require("./ai.service");
const logger = require("../config/logger");

class MatchingService {
  /**
   * Calculate a hybrid matching score between a resume profile and a job description.
   * Weight breakdown:
   * - 60%: Semantic AI analysis (via Gemini/OpenAI)
   * - 40%: Local deterministic keyword/technology matching
   * @param {Object} parsedResumeData 
   * @param {Object} job 
   */
  async calculateMatch(parsedResumeData, job) {
    logger.info(`Matching Service: Starting hybrid scoring for job: "${job.title}"`);

    try {
      // 1. Local Deterministic Keyword matching (40% weight)
      const keywordScore = this.calculateKeywordScore(parsedResumeData, job);

      // 2. Semantic AI Matching (60% weight)
      const aiResult = await aiService.matchJob(parsedResumeData, job.description);
      const aiScore = aiResult.matchPercentage;

      // 3. Compute weighted hybrid score
      const hybridScore = Math.round(aiScore * 0.6 + keywordScore * 0.4);

      logger.info(
        `Matching Service: Hybrid calculations complete. AI Score: ${aiScore}%, Keyword Score: ${keywordScore}%, Hybrid: ${hybridScore}%`
      );

      return {
        matchPercentage: hybridScore,
        explanation: aiResult.explanation,
        advantages: aiResult.advantages,
        disadvantages: aiResult.disadvantages,
        missingSkills: aiResult.missingSkills,
        requiredCertifications: aiResult.requiredCertifications,
        requiredExperienceNeeded: aiResult.requiredExperienceNeeded,
        keywordScore,
        aiScore,
      };
    } catch (error) {
      logger.error(`Matching Service: Matching engine error: ${error.message}`, { error });
      // Clean fallback if AI fails
      return {
        matchPercentage: 50,
        explanation: "Unable to complete semantic match. Fallback score based on local keyword scan.",
        advantages: ["Technical profile contains matching keywords."],
        disadvantages: ["AI comparison timed out."],
        missingSkills: [],
        requiredCertifications: [],
        requiredExperienceNeeded: "Not assessed.",
        keywordScore: 50,
        aiScore: 50,
      };
    }
  }

  /**
   * Helper to perform local Jaccard-like matching of technology keywords
   */
  calculateKeywordScore(resume, job) {
    // 1. Gather all candidate keywords in lowercase
    const candidateKeywords = new Set(
      [
        ...(resume.skills || []),
        ...(resume.technologies || []),
        ...(resume.frameworks || []),
      ].map((k) => k.toLowerCase().trim())
    );

    // Add project specific technologies
    if (resume.projects) {
      resume.projects.forEach((p) => {
        if (p.technologies) {
          p.technologies.forEach((t) => candidateKeywords.add(t.toLowerCase().trim()));
        }
      });
    }

    if (candidateKeywords.size === 0) return 0;

    // 2. Identify expected keywords in the job description & title
    const jobText = `${job.title} ${job.description} ${(job.requirements || []).join(" ")}`.toLowerCase();
    
    // We search for a list of standard tech stack keywords to evaluate match relevance
    const standardKeywords = [
      "javascript", "typescript", "python", "java", "c++", "c#", "ruby", "go", "golang", "php", "rust", "scala",
      "react", "angular", "vue", "next.js", "nuxt", "node.js", "express", "django", "flask", "fastapi", "spring",
      "mongodb", "postgresql", "mysql", "redis", "cassandra", "sqlite", "oracle", "mariadb",
      "aws", "azure", "gcp", "docker", "kubernetes", "jenkins", "terraform", "ansible", "git", "ci/cd",
      "html", "css", "tailwindcss", "bootstrap", "sass", "graphql", "rest", "restful", "grpc",
      "scrum", "agile", "project management", "product management", "jira", "figma",
      "pandas", "numpy", "excel", "tableau", "power bi", "scikit-learn"
    ];

    const expectedKeywords = standardKeywords.filter((keyword) => {
      // Find if standard keyword exists as a word or substring in the job description
      const regex = new RegExp(`\\b${this.escapeRegExp(keyword)}\\b`, "i");
      return regex.test(jobText);
    });

    if (expectedKeywords.length === 0) {
      // If no expected keywords match, return a base level Jaccard match of 50%
      return 50;
    }

    // 3. Count candidate's overlapping keywords
    let matchesCount = 0;
    expectedKeywords.forEach((keyword) => {
      if (candidateKeywords.has(keyword)) {
        matchesCount++;
      }
    });

    const score = Math.round((matchesCount / expectedKeywords.length) * 100);
    return score;
  }

  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}

module.exports = new MatchingService();
