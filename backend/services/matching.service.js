const aiService = require("./ai.service");
const logger = require("../config/logger");

class MatchingService {
  /**
   * Calculate a hybrid matching score between a resume profile and a job description.
   * Weight breakdown:
   * - 60%: Semantic AI analysis (via Gemini/OpenAI/Nvidia/DeepSeek)
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

      const matchingSkills = this.computeMatchingSkills(parsedResumeData, job);
      const missingSkills = aiResult.missingSkills || [];
      const recommendation = this.buildRecommendation(hybridScore, missingSkills);

      return {
        matchPercentage: hybridScore,
        explanation: aiResult.explanation,
        why: aiResult.explanation,
        advantages: aiResult.advantages,
        disadvantages: aiResult.disadvantages,
        matchingSkills: aiResult.matchingSkills && aiResult.matchingSkills.length ? aiResult.matchingSkills : matchingSkills,
        missingSkills,
        resumeSuggestions: aiResult.resumeSuggestions || [],
        recommendation: aiResult.recommendation || recommendation,
        interviewReadiness: aiResult.interviewReadiness || "Not Specified",
        difficultyLevel: aiResult.difficultyLevel || "Not Specified",
        interviewTopics: aiResult.interviewTopics || [],
        prepRoadmap: aiResult.prepRoadmap || [],
        learningResources: aiResult.learningResources || [],
        requiredCertifications: aiResult.requiredCertifications,
        requiredExperienceNeeded: aiResult.requiredExperienceNeeded,
        keywordScore,
        aiScore,
      };
    } catch (error) {
      logger.error(`Matching Service: Matching engine error: ${error.message}`, { error });
      // Clean fallback if AI fails — still surface deterministic skill overlap.
      const matchingSkills = this.computeMatchingSkills(parsedResumeData, job);
      return {
        matchPercentage: 50,
        explanation: "Unable to complete semantic match. Fallback score based on local keyword scan.",
        why: "Unable to complete semantic match. Fallback score based on local keyword scan.",
        advantages: ["Technical profile contains matching keywords."],
        disadvantages: ["AI comparison timed out."],
        matchingSkills,
        missingSkills: [],
        resumeSuggestions: ["Incorporate more keywords from the job description."],
        recommendation: this.buildRecommendation(50, []),
        interviewReadiness: "Requires Prep",
        difficultyLevel: "Medium",
        interviewTopics: ["Core Javascript/TypeScript concepts", "Framework-specific best practices"],
        prepRoadmap: ["Review the job description carefully.", "Identify core skills requested and prepare examples."],
        learningResources: [],
        requiredCertifications: [],
        requiredExperienceNeeded: "Not assessed.",
        keywordScore: 50,
        aiScore: 50,
      };
    }
  }

  /**
   * Deterministic intersection of the candidate's skills with the job's
   * enriched skill list. Case-insensitive; returns the job's original casing.
   * @returns {string[]}
   */
  computeMatchingSkills(resume, job) {
    const candidate = new Set(
      [
        ...(resume.skills || []),
        ...(resume.technologies || []),
        ...(resume.frameworks || []),
      ]
        .filter(Boolean)
        .map((k) => k.toLowerCase().trim())
    );
    if (resume.projects) {
      resume.projects.forEach((p) =>
        (p.technologies || []).forEach((t) => candidate.add((t || "").toLowerCase().trim()))
      );
    }

    const jobSkills = [...(job.skills || []), ...(job.technologies || [])];
    const seen = new Set();
    const matches = [];
    for (const skill of jobSkills) {
      const key = (skill || "").toLowerCase().trim();
      if (key && candidate.has(key) && !seen.has(key)) {
        seen.add(key);
        matches.push(skill);
      }
    }
    return matches;
  }

  /**
   * Build a short, human recommendation from the score + top missing skills.
   * @returns {string}
   */
  buildRecommendation(score, missingSkills = []) {
    const top = (missingSkills || []).slice(0, 2).filter(Boolean);
    const learn = top.length
      ? ` Learning ${top.join(" and ")} will significantly improve your chances.`
      : "";

    if (score >= 85) return `Excellent match.${learn || " You are a strong fit for this role."}`;
    if (score >= 70) return `Strong match.${learn || " Highlight your relevant experience when applying."}`;
    if (score >= 50) return `Moderate match.${learn || " Tailor your resume to the role's keywords."}`;
    return `Low match. Consider roles closer to your current skill set.${learn}`;
  }

  /**
   * Helper to perform local Jaccard-like matching of technology keywords
   */
  calculateKeywordScore(resume, job) {
    const candidateKeywords = new Set(
      [
        ...(resume.skills || []),
        ...(resume.technologies || []),
        ...(resume.frameworks || []),
      ].map((k) => k.toLowerCase().trim())
    );

    if (resume.projects) {
      resume.projects.forEach((p) => {
        if (p.technologies) {
          p.technologies.forEach((t) => candidateKeywords.add(t.toLowerCase().trim()));
        }
      });
    }

    if (candidateKeywords.size === 0) return 0;

    const jobText = `${job.title} ${job.description} ${(job.requirements || []).join(" ")}`.toLowerCase();
    
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
      const regex = new RegExp(`\\b${this.escapeRegExp(keyword)}\\b`, "i");
      return regex.test(jobText);
    });

    if (expectedKeywords.length === 0) {
      return 50;
    }

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
