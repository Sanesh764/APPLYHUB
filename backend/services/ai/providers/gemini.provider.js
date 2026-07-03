const { GoogleGenerativeAI } = require("@google/generative-ai");
const BaseProvider = require("./base.provider");
const logger = require("../../../config/logger");

class GeminiProvider extends BaseProvider {
  constructor() {
    super("gemini");
    this.apiKey = process.env.GEMINI_API_KEY;
    this.client = null;

    if (this.apiKey && !this.isPlaceholderKey(this.apiKey)) {
      this.client = new GoogleGenerativeAI(this.apiKey);
    }
  }

  isConfigured() {
    return !!this.client;
  }

  async queryLLM(prompt, systemInstruction) {
    if (!this.isConfigured()) {
      throw new Error("Gemini Provider is not configured. Missing API Key.");
    }

    const model = this.client.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction,
      generationConfig: { responseMimeType: "application/json" },
    });

    const response = await model.generateContent(prompt);
    const text = response.response.text();
    return JSON.parse(this.cleanJSONString(text));
  }

  async parseResume(rawText) {
    if (!this.isConfigured()) return this.getMockParsedData();

    const systemInstruction = `You are a recruiting parser. Extract candidate details and format strictly to this JSON schema:
    {
      "name": "Full Name",
      "email": "Email Address",
      "phone": "Phone Number",
      "skills": ["Broad skills like Python"],
      "technologies": ["Technologies like Git, Docker"],
      "frameworks": ["Frameworks like React, Node.js"],
      "languages": ["Languages spoken"],
      "certifications": ["Certifications earned"],
      "projects": [{"title": "Project Title", "description": "Project details", "technologies": ["techs"]}],
      "experience": [{"company": "Company Name", "role": "Job Role", "startDate": "YYYY-MM", "endDate": "YYYY-MM or Present", "description": "duties"}],
      "education": [{"institution": "Institution Name", "degree": "Degree", "fieldOfStudy": "Major", "graduationYear": "YYYY"}],
      "achievements": ["Accomplishments"],
      "softSkills": ["Soft skills"]
    }`;

    try {
      const rawJson = await this.queryLLM(`Resume text to parse: \n\n${rawText}`, systemInstruction);
      return this.parsedDataSchema.parse(rawJson);
    } catch (err) {
      logger.error("Gemini parseResume failed, returning mock fallback", err);
      return this.getMockParsedData();
    }
  }

  async analyzeATS(parsedData, targetRole) {
    if (!this.isConfigured()) return this.getMockATSAnalysis();

    const systemInstruction = `You are an ATS advisor. Analyze resume details against a target role. Format output strictly to this JSON schema:
    {
      "atsScore": 85,
      "missingSkills": ["expected skills missing"],
      "strongSkills": ["highlighted skills present"],
      "weakSkills": ["skills showing weak experience"],
      "quality": "Text summarizing impact",
      "keywordAnalysis": ["keywords to include"],
      "grammarIssues": ["grammar issues found or 'None'"],
      "formattingSuggestions": ["formatting tips"],
      "missingSections": ["missing structural blocks"],
      "industryScore": 80,
      "careerLevel": "Level description",
      "improvementSuggestions": ["actionable steps"]
    }`;

    try {
      const rawJson = await this.queryLLM(`Target Role: ${targetRole}\nProfile Data: ${JSON.stringify(parsedData)}`, systemInstruction);
      return this.atsAnalysisSchema.parse(rawJson);
    } catch (err) {
      logger.error("Gemini analyzeATS failed, returning mock fallback", err);
      return this.getMockATSAnalysis();
    }
  }

  async matchJob(parsedData, jobDescription) {
    if (!this.isConfigured()) return this.getMockJobMatching();

    const systemInstruction = `You are a career matcher. Compare resume profile against job description. Format output strictly to this JSON schema:
    {
      "matchPercentage": 75,
      "explanation": "reasons for score",
      "advantages": ["candidate strengths"],
      "disadvantages": ["candidate gaps"],
      "missingSkills": ["missing requirements"],
      "requiredCertifications": ["missing certifications"],
      "requiredExperienceNeeded": "explanation of experience gaps"
    }`;

    try {
      const rawJson = await this.queryLLM(`Resume Profile: ${JSON.stringify(parsedData)}\nJob Description: ${jobDescription}`, systemInstruction);
      return this.jobMatchingSchema.parse(rawJson);
    } catch (err) {
      logger.error("Gemini matchJob failed, returning mock fallback", err);
      return this.getMockJobMatching();
    }
  }

  async generateCoverLetter(parsedData, companyName, jobTitle, jobDescription) {
    if (!this.isConfigured()) return this.getMockCoverLetter(companyName, jobTitle);

    const systemPrompt = `You are an expert career consultant. Write a professional cover letter based on the candidate's resume data and the target job. Do not use placeholder fields like [Date]; output a cohesive ready-to-use letter.`;

    try {
      const model = this.client.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: systemPrompt });
      const result = await model.generateContent(`Candidate Profile: ${JSON.stringify(parsedData)}\nCompany: ${companyName}\nRole: ${jobTitle}\nJob Description: ${jobDescription}`);
      return result.response.text();
    } catch (err) {
      logger.error("Gemini generateCoverLetter failed, returning mock fallback", err);
      return this.getMockCoverLetter(companyName, jobTitle);
    }
  }

  async generateInterviewQuestions(parsedData, jobTitle, jobDescription) {
    if (!this.isConfigured()) return this.getMockInterviewQuestions();

    const systemPrompt = `You are an expert technical interviewer. Generate 3 highly relevant interview questions based on the candidate's resume details and the target job requirements.`;

    try {
      const model = this.client.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: systemPrompt });
      const result = await model.generateContent(`Candidate Profile: ${JSON.stringify(parsedData)}\nRole: ${jobTitle}\nJob Description: ${jobDescription}`);
      return result.response.text();
    } catch (err) {
      logger.error("Gemini generateInterviewQuestions failed, returning mock fallback", err);
      return this.getMockInterviewQuestions();
    }
  }

  async testPrompt(prompt) {
    if (!this.isConfigured()) {
      return "Gemini Provider is currently operating in MOCK Mode. Set GEMINI_API_KEY to execute live queries.";
    }

    const model = this.client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  async healthCheck() {
    const startTime = Date.now();
    
    if (!this.apiKey) {
      return { status: "unhealthy", reason: "API key is missing in environment configs", latency: "0ms" };
    }
    if (this.isPlaceholderKey(this.apiKey)) {
      return { status: "unhealthy", reason: "API key is set to a placeholder template", latency: "0ms" };
    }

    try {
      // Test model connectivity
      const model = this.client.getGenerativeModel({ model: "gemini-1.5-flash" });
      await model.generateContent("ping");
      const duration = Date.now() - startTime;
      return { status: "healthy", latency: `${duration}ms` };
    } catch (error) {
      const duration = Date.now() - startTime;
      let reason = error.message || "Unknown API response error";
      if (reason.includes("API key not valid") || reason.includes("API_KEY_INVALID")) {
        reason = "Invalid credentials: API key rejected by Google Cloud Gateway.";
      }
      return { status: "unhealthy", reason, latency: `${duration}ms` };
    }
  }
}

module.exports = GeminiProvider;
