const OpenAI = require("openai");
const BaseProvider = require("./base.provider");
const logger = require("../../../config/logger");

class OpenAIProvider extends BaseProvider {
  constructor() {
    super("openai");
    this.apiKey = process.env.OPENAI_API_KEY;
    this.client = null;

    if (this.apiKey && !this.isPlaceholderKey(this.apiKey)) {
      this.client = new OpenAI({ apiKey: this.apiKey });
    }
  }

  isConfigured() {
    return !!this.client;
  }

  async queryLLM(prompt, systemInstruction) {
    if (!this.isConfigured()) {
      throw new Error("OpenAI Provider is not configured. Missing API Key.");
    }

    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
    });

    const text = response.choices[0].message.content;
    return JSON.parse(this.cleanJSONString(text));
  }

  async queryLLMText(prompt, systemInstruction) {
    if (!this.isConfigured()) {
      throw new Error("OpenAI Provider is not configured. Missing API Key.");
    }

    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
    });

    return response.choices[0].message.content;
  }

  async testPrompt(prompt) {
    if (!this.isConfigured()) {
      return "OpenAI Provider is currently operating in MOCK Mode. Set OPENAI_API_KEY to execute live queries.";
    }

    const response = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
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
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "ping" }],
        max_tokens: 5,
      });
      const duration = Date.now() - startTime;
      return { status: "healthy", latency: `${duration}ms` };
    } catch (error) {
      const duration = Date.now() - startTime;
      return { status: "unhealthy", reason: error.message || "Unknown OpenAI API response error", latency: `${duration}ms` };
    }
  }
}

module.exports = OpenAIProvider;
