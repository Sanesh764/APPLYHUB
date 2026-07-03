const OpenAI = require("openai");
const BaseProvider = require("./base.provider");
const logger = require("../../../config/logger");

class NvidiaProvider extends BaseProvider {
  constructor() {
    super("nvidia");
    this.apiKey = process.env.NVIDIA_API_KEY;
    this.modelName = process.env.NVIDIA_MODEL || "meta/llama-3.1-8b-instruct";
    this.client = null;

    if (this.apiKey && !this.isPlaceholderKey(this.apiKey)) {
      this.client = new OpenAI({
        apiKey: this.apiKey,
        baseURL: "https://integrate.api.nvidia.com/v1",
      });
      logger.info(`Nvidia Provider: Client initialized targeting model "${this.modelName}"`);
    }
  }

  isConfigured() {
    return !!this.client;
  }

  /**
   * General LLM Query.
   * Note: We avoid response_format: { type: "json_object" } since some NVIDIA models
   * do not support it natively and will throw parameter errors.
   */
  async queryLLM(prompt, systemInstruction) {
    if (!this.isConfigured()) {
      throw new Error("NVIDIA Provider is not configured. Missing API Key.");
    }

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [
        { role: "system", content: `${systemInstruction}\nReturn ONLY a valid JSON block. Do NOT surround it with explanations or descriptions.` },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 2048,
    });

    const text = response.choices[0].message.content;
    const cleanedText = this.cleanJSONString(text);
    return JSON.parse(cleanedText);
  }

  async parseResume(rawText) {
    if (!this.isConfigured()) return this.getMockParsedData();

    const systemInstruction = `You are a professional recruiting parser. Extract candidate details and format strictly to this JSON schema:
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
      logger.error("Nvidia parseResume failed, returning mock fallback", err);
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
      logger.error("Nvidia analyzeATS failed, returning mock fallback", err);
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
      logger.error("Nvidia matchJob failed, returning mock fallback", err);
      return this.getMockJobMatching();
    }
  }

  async generateCoverLetter(parsedData, companyName, jobTitle, jobDescription) {
    if (!this.isConfigured()) return this.getMockCoverLetter(companyName, jobTitle);

    const systemPrompt = `You are an expert career consultant. Write a professional cover letter based on the candidate's resume data and the target job. Do not use placeholder fields like [Date]; output a cohesive ready-to-use letter.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Candidate Profile: ${JSON.stringify(parsedData)}\nCompany: ${companyName}\nRole: ${jobTitle}\nJob Description: ${jobDescription}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 1024,
      });
      return response.choices[0].message.content;
    } catch (err) {
      logger.error("Nvidia generateCoverLetter failed, returning mock fallback", err);
      return this.getMockCoverLetter(companyName, jobTitle);
    }
  }

  async generateInterviewQuestions(parsedData, jobTitle, jobDescription) {
    if (!this.isConfigured()) return this.getMockInterviewQuestions();

    const systemPrompt = `You are an expert technical interviewer. Generate 3 highly relevant interview questions based on the candidate's resume details and the target job requirements.`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Candidate Profile: ${JSON.stringify(parsedData)}\nRole: ${jobTitle}\nJob Description: ${jobDescription}`,
          },
        ],
        temperature: 0.5,
        max_tokens: 1024,
      });
      return response.choices[0].message.content;
    } catch (err) {
      logger.error("Nvidia generateInterviewQuestions failed, returning mock fallback", err);
      return this.getMockInterviewQuestions();
    }
  }

  async testPrompt(prompt) {
    if (!this.isConfigured()) {
      return "Nvidia Provider is currently operating in MOCK Mode. Set NVIDIA_API_KEY to execute live queries.";
    }

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    });
    return response.choices[0].message.content;
  }

  async healthCheck() {
    const startTime = Date.now();
    
    if (!this.apiKey) {
      return { status: "unhealthy", reason: "NVIDIA API key is missing in environment configs", latency: "0ms" };
    }
    if (this.isPlaceholderKey(this.apiKey)) {
      return { status: "unhealthy", reason: "NVIDIA API key is set to a placeholder template", latency: "0ms" };
    }

    try {
      // Test model connectivity
      await this.client.chat.completions.create({
        model: this.modelName,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      });
      const duration = Date.now() - startTime;
      return { status: "healthy", latency: `${duration}ms` };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Determine exact error reason
      let reason = error.message || "Unknown NVIDIA API connection error";
      const statusCode = error.status || error.statusCode || 500;

      if (statusCode === 401 || reason.includes("Unauthorized") || reason.includes("invalid api key")) {
        reason = "Authentication failed: NVIDIA API key is invalid or unauthorized.";
      } else if (statusCode === 404 || reason.includes("model not found")) {
        reason = `Model unreachable: NVIDIA Model "${this.modelName}" could not be resolved (HTTP 404).`;
      } else if (statusCode === 429) {
        reason = "Rate limit exceeded: NVIDIA quota limits encountered (HTTP 429).";
      } else {
        reason = `API Error (HTTP ${statusCode}): ${reason}`;
      }

      return { status: "unhealthy", reason, latency: `${duration}ms` };
    }
  }
}

module.exports = NvidiaProvider;
