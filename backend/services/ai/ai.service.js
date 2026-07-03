const GeminiProvider = require("./providers/gemini.provider");
const OpenAIProvider = require("./providers/openai.provider");
const NvidiaProvider = require("./providers/nvidia.provider");
const logger = require("../../config/logger");

class AIService {
  constructor() {
    this.providerName = process.env.AI_PROVIDER || "gemini";
    this.provider = null;

    logger.info(`AI Service: Initializing core. Selected provider: "${this.providerName}"`);
    this.resolveProvider();
  }

  /**
   * Instantiates the active provider class on-demand
   */
  resolveProvider() {
    switch (this.providerName.toLowerCase()) {
      case "gemini":
        this.provider = new GeminiProvider();
        break;
      case "openai":
        this.provider = new OpenAIProvider();
        break;
      case "nvidia":
        this.provider = new NvidiaProvider();
        break;
      default:
        logger.warn(`AI Service: Unknown provider "${this.providerName}". Defaulting to Gemini.`);
        this.provider = new GeminiProvider();
        this.providerName = "gemini";
    }
  }

  /**
   * Wrapper execute helper to measure latency and log metrics
   */
  async execute(methodName, ...args) {
    const startTime = Date.now();
    logger.info(`AI Service: Executing "${methodName}" on provider "${this.providerName}"`);

    try {
      if (typeof this.provider[methodName] !== "function") {
        throw new Error(`Active provider "${this.providerName}" does not implement "${methodName}"`);
      }

      const result = await this.provider[methodName](...args);
      const duration = Date.now() - startTime;
      
      logger.info(`AI Service Metrics: [${this.providerName}] - ${methodName} finished in ${duration}ms. Success: true`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error(`AI Service Metrics: [${this.providerName}] - ${methodName} failed after ${duration}ms. Error: ${error.message}`);
      throw error;
    }
  }

  async parseResume(rawText) {
    return this.execute("parseResume", rawText);
  }

  async analyzeATS(parsedData, targetRole) {
    return this.execute("analyzeATS", parsedData, targetRole);
  }

  async matchJob(parsedData, jobDescription) {
    return this.execute("matchJob", parsedData, jobDescription);
  }

  async generateCoverLetter(parsedData, companyName, jobTitle, jobDescription) {
    return this.execute("generateCoverLetter", parsedData, companyName, jobTitle, jobDescription);
  }

  async generateInterviewQuestions(parsedData, jobTitle, jobDescription) {
    return this.execute("generateInterviewQuestions", parsedData, jobTitle, jobDescription);
  }

  async testPrompt(prompt) {
    return this.execute("testPrompt", prompt);
  }

  async healthCheck() {
    return this.execute("healthCheck");
  }
}

module.exports = new AIService();
