require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const logger = require("../config/logger");

async function verifyGemini() {
  console.log("=== GEMINI AI INTEGRATION DIAGNOSTICS ===");

  const key = process.env.GEMINI_API_KEY;
  const keyExists = !!key;
  console.log(`GEMINI_API_KEY Loaded: ${keyExists ? "✅ Yes" : "❌ No"}`);

  if (!keyExists) {
    throw new Error("FAIL: GEMINI_API_KEY is not defined in the environment variables.");
  }

  // Initialize Gemini Client
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });

  const prompt = "Return only JSON with the keys name, skills, summary. Keep values realistic for a web developer.";

  console.log(`\nSending prompt to Gemini: "${prompt}"`);
  
  const startTime = Date.now();
  try {
    // 1. Calculate input tokens if API is working
    let inputTokens = 0;
    try {
      const countResult = await model.countTokens(prompt);
      inputTokens = countResult.totalTokens;
      console.log(`  Calculated Input Tokens: ${inputTokens}`);
    } catch (e) {
      console.log("  Failed to pre-calculate token usage.");
    }

    // 2. Execute content generation
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const duration = Date.now() - startTime;
    const text = response.text();

    console.log(`\n✅ API Response Received in ${duration}ms`);
    console.log("Response text:", text);

    // 3. Validate JSON structure
    const parsed = JSON.parse(text);
    const requiredKeys = ["name", "skills", "summary"];
    const missingKeys = requiredKeys.filter((k) => !(k in parsed));

    if (missingKeys.length > 0) {
      throw new Error(`Invalid JSON schema. Missing keys: ${missingKeys.join(", ")}`);
    }

    console.log("✅ Response structure validated successfully.");
    console.log(`\nVerification Summary:`);
    console.log(`  Status: SUCCESS`);
    console.log(`  Execution Time: ${duration}ms`);
    console.log(`  Input Tokens: ${inputTokens}`);
    console.log(`  Name: ${parsed.name}`);
    console.log(`  Skills: ${parsed.skills}`);
    console.log(`  Summary: ${parsed.summary}`);

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`\n❌ GEMINI REQUEST FAILED after ${duration}ms!`);
    console.error(`  Error message: ${error.message}`);
    
    // Provide diagnostic explanation
    if (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID")) {
      console.error("\nDiagnostic Suggestion: The GEMINI_API_KEY configured in your .env file is rejected by Google AI Studio. Please obtain a fresh, valid API key from https://aistudio.google.com/ and update your .env file.");
    }
    
    throw error;
  }
}

verifyGemini().catch((err) => {
  console.error("\nGemini diagnostics terminated with errors.");
  process.exit(1);
});
