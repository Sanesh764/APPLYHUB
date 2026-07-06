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

  async queryLLMText(prompt, systemInstruction) {
    if (!this.isConfigured()) {
      throw new Error("Gemini Provider is not configured. Missing API Key.");
    }

    const model = this.client.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction,
    });

    const response = await model.generateContent(prompt);
    return response.response.text();
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
