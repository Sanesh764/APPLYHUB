require("dotenv").config();
const app = require("../app");
const http = require("http");
const axios = require("axios");

async function verifyNvidiaAI() {
  console.log("=== NVIDIA AI INTEGRATION DIAGNOSTICS ===");

  const key = process.env.NVIDIA_API_KEY;
  const provider = process.env.AI_PROVIDER;
  console.log(`NVIDIA_API_KEY Loaded: ${key ? "✅ Yes" : "❌ No"}`);
  console.log(`AI_PROVIDER Value: ${provider}`);

  if (!key) {
    throw new Error("FAIL: NVIDIA_API_KEY is not defined in the environment variables.");
  }

  // Start temporary server to verify HTTP interfaces
  const server = http.createServer(app);
  server.listen(9050, async () => {
    console.log("Started temporary API server on port 9050...");
    try {
      // 1. Test Health Endpoint
      console.log("\n[1] Testing AI Health Check Endpoint (GET /api/v1/ai/health)...");
      const healthStartTime = Date.now();
      const healthRes = await axios.get("http://localhost:9050/api/v1/ai/health");
      const healthDuration = Date.now() - healthStartTime;

      console.log("Health API Response Status:", healthRes.status);
      console.log("Health API Response Body:", JSON.stringify(healthRes.data, null, 2));

      if (healthRes.data.status !== "healthy") {
        throw new Error(`AI Provider health status is unhealthy: ${healthRes.data.reason}`);
      }

      // 2. Test Custom Prompt Request Endpoint
      console.log("\n[2] Testing AI Raw Prompt Endpoint (POST /api/v1/ai/test)...");
      const promptStartTime = Date.now();
      const promptRes = await axios.post("http://localhost:9050/api/v1/ai/test", {
        prompt: "Return only JSON with the keys name, skills, summary. Keep values realistic for a web developer.",
      });
      const promptDuration = Date.now() - promptStartTime;

      console.log("Test API Response Status:", promptRes.status);
      console.log("Test API Response Body:", JSON.stringify(promptRes.data, null, 2));

      // Clean and parse text response
      let rawText = promptRes.data.response.trim();
      const startIdx = rawText.indexOf("{");
      const endIdx = rawText.lastIndexOf("}");
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        rawText = rawText.substring(startIdx, endIdx + 1);
      }
      const parsedText = JSON.parse(rawText);
      const requiredKeys = ["name", "skills", "summary"];
      const missingKeys = requiredKeys.filter((k) => !(k in parsedText));

      if (missingKeys.length > 0) {
        throw new Error(`Response missing required JSON keys: ${missingKeys.join(", ")}`);
      }

      console.log("\n=== ALL NVIDIA AI INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
      console.log(`  Active Provider: ${healthRes.data.provider}`);
      console.log(`  Health Latency: ${healthRes.data.latency} (HTTP wrapper: ${healthDuration}ms)`);
      console.log(`  Prompt Latency: ${promptDuration}ms`);
      
      server.close();
      console.log("\nTemporary API server stopped.");
    } catch (err) {
      console.error("\n❌ NVIDIA AI DIAGNOSTICS FAILED!");
      if (err.response) {
        console.error("API Error Response Status:", err.response.status);
        console.error("API Error Response Data:", JSON.stringify(err.response.data, null, 2));
      } else {
        console.error("Error Message:", err.message);
      }
      server.close();
      process.exit(1);
    }
  });
}

verifyNvidiaAI().catch((err) => {
  console.error(err);
  process.exit(1);
});
