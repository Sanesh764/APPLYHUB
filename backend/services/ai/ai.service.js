const GeminiProvider = require("./providers/gemini.provider");
const OpenAIProvider = require("./providers/openai.provider");
const NvidiaProvider = require("./providers/nvidia.provider");
const logger = require("../../config/logger");

class AIService {
  constructor() {
    this.providerInstances = {};
    logger.info("AI Service: Orchestration layer initialized. Priority chain set to NVIDIA -> DeepSeek -> Gemini.");
  }

  /**
   * Lazily loads and returns the provider instance if its credentials exist in env
   */
  getProviderInstance(name) {
    const normName = name.toLowerCase();
    if (this.providerInstances[normName]) {
      return this.providerInstances[normName];
    }

    try {
      let instance = null;
      switch (normName) {
        case "nvidia":
          if (process.env.NVIDIA_API_KEY) {
            instance = new NvidiaProvider();
          }
          break;
        case "deepseek":
          if (process.env.DEEPSEEK_API_KEY) {
            const DeepSeekProvider = require("./providers/deepseek.provider");
            instance = new DeepSeekProvider();
          }
          break;
        case "gemini":
          if (process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY_FALLBACK) {
            instance = new GeminiProvider();
          }
          break;
        case "openai":
          if (process.env.OPENAI_API_KEY) {
            instance = new OpenAIProvider();
          }
          break;
      }

      if (instance) {
        this.providerInstances[normName] = instance;
        return instance;
      }
    } catch (err) {
      logger.error(`AI Service: Failed to construct provider "${name}": ${err.message}`);
    }

    return null;
  }

  /**
   * Orchestrates the fallback execution logic across configured providers
   */
  async execute(methodName, ...args) {
    const providersPriority = ["nvidia", "deepseek", "gemini"];
    let lastError = null;

    for (let i = 0; i < providersPriority.length; i++) {
      const currentProvider = providersPriority[i];
      const startTime = Date.now();

      try {
        const providerInstance = this.getProviderInstance(currentProvider);
        if (!providerInstance) {
          throw new Error(`Provider credentials for "${currentProvider}" are missing or unconfigured.`);
        }

        if (typeof providerInstance[methodName] !== "function") {
          throw new Error(`Method "${methodName}" is not implemented by provider "${currentProvider}".`);
        }

        logger.info(`AI Service: Dispatching "${methodName}" to provider "${currentProvider}"`);
        const result = await providerInstance[methodName](...args);
        const duration = Date.now() - startTime;

        const fallbackUsed = i > 0 ? providersPriority.slice(0, i).join(", ") : null;
        logger.info(`AI Service Metrics: [${currentProvider}] - ${methodName} finished in ${duration}ms. Fallbacks triggered: ${fallbackUsed || "None"}. Success: true`);
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        lastError = error;
        logger.warn(`AI Service Metrics: [${currentProvider}] - ${methodName} failed after ${duration}ms. Swapping to next fallback. Error: ${error.message}`);
      }
    }

    // Default Fallback: If all three providers fail (e.g. key quota exceeded or invalid), we invoke a mock default to avoid blocking critical user flows
    logger.error(`AI Service Metrics: All configured providers failed for "${methodName}". Activating fallback mock default.`);
    
    // Attempt to return a mock default from the last tried provider
    const finalFallbackProvider = new GeminiProvider();
    if (typeof finalFallbackProvider[methodName] === "function") {
      // BaseProvider fallback mocks are named like "getMockParsedData", but calling provider's native check handles mock fallback internally
      try {
        // Force the provider to run in unconfigured mode to get its fallback mock output
        const unconfigured = new GeminiProvider();
        unconfigured.apiKey = null; // force mock behavior
        return await unconfigured[methodName](...args);
      } catch (e) {
        logger.error(`AI Service: Final mock fallback also failed: ${e.message}`);
      }
    }

    throw new Error(`AI Service: All providers failed to resolve "${methodName}". Last error: ${lastError.message}`);
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

  async summarizeJob(job) {
    return this.execute("summarizeJob", job);
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
