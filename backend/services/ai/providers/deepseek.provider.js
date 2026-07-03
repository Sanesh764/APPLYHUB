const OpenAI = require("openai");
const BaseProvider = require("./base.provider");
const logger = require("../../../config/logger");

class DeepSeekProvider extends BaseProvider {
  constructor() {
    super("deepseek");
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.client = null;

    if (this.apiKey && !this.isPlaceholderKey(this.apiKey)) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: "https://api.deepseek.com",
      });
    }
  }

  isConfigured() {
    return !!this.client;
  }

  async queryLLM(prompt, systemInstruction) {
    if (!this.isConfigured()) {
      throw new Error("DeepSeek Provider is not configured. Missing API Key.");
    }

    const response = await this.client.chat.completions.create({
      model: "deepseek-chat",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
    });

    const text = response.choices[0].message.content;
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
      logger.error("DeepSeek parseResume failed, returning mock fallback", err);
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
      logger.error("DeepSeek analyzeATS failed, returning mock fallback", err);
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
      logger.error("DeepSeek matchJob failed, returning mock fallback", err);
      return this.getMockJobMatching();
    }
  }

  async generateCoverLetter(parsedData, companyName, jobTitle, jobDescription) {
    if (!this.isConfigured()) return this.getMockCoverLetter(companyName, jobTitle);

    const systemPrompt = `You are an expert career consultant. Write a professional cover letter based on the candidate's resume data and the target job. Do not use placeholder fields like [Date]; output a cohesive ready-to-use letter.`;

    try {
      const response = await this.client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Candidate Profile: ${JSON.stringify(parsedData)}\nCompany: ${companyName}\nRole: ${jobTitle}\nJob Description: ${jobDescription}`,
          },
        ],
      });
      return response.choices[0].message.content;
    } catch (err) {
      logger.error("DeepSeek generateCoverLetter failed, returning mock fallback", err);
      return this.getMockCoverLetter(companyName, jobTitle);
    }
  }

  async generateInterviewQuestions(parsedData, jobTitle, jobDescription) {
    if (!this.isConfigured()) return this.getMockInterviewQuestions();

    const systemPrompt = `You are an expert technical interviewer. Generate 3 highly relevant interview questions based on the candidate's resume details and the target job requirements.`;

    try {
      const response = await this.client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Candidate Profile: ${JSON.stringify(parsedData)}\nRole: ${jobTitle}\nJob Description: ${jobDescription}`,
          },
        ],
      });
      return response.choices[0].message.content;
    } catch (err) {
      logger.error("DeepSeek generateInterviewQuestions failed, returning mock fallback", err);
      return this.getMockInterviewQuestions();
    }
  }

  async testPrompt(prompt) {
    if (!this.isConfigured()) {
      return "DeepSeek Provider is currently operating in MOCK Mode. Set DEEPSEEK_API_KEY to execute live queries.";
    }

    const response = await this.client.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
    });
    return response.choices[0].message.content;
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
      await this.client.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      });
      const duration = Date.now() - startTime;
      return { status: "healthy", latency: `${duration}ms` };
    } catch (error) {
      const duration = Date.now() - startTime;
      return { status: "unhealthy", reason: error.message || "Unknown DeepSeek API response error", latency: `${duration}ms` };
    }
  }
}

module.exports = DeepSeekProvider;
