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

  async queryLLMText(prompt, systemInstruction) {
    if (!this.isConfigured()) {
      throw new Error("NVIDIA Provider is not configured. Missing API Key.");
    }

    const response = await this.client.chat.completions.create({
      model: this.modelName,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
      max_tokens: 1024,
    });

    return response.choices[0].message.content;
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
      await this.client.chat.completions.create({
        model: this.modelName,
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      });
      const duration = Date.now() - startTime;
      return { status: "healthy", latency: `${duration}ms` };
    } catch (error) {
      const duration = Date.now() - startTime;
      
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
