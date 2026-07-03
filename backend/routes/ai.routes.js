const express = require("express");
const router = express.Router();
const aiService = require("../services/ai.service");
const { protect } = require("../middleware/auth");

// GET /api/v1/ai/health - Verify model connection and authentication state
router.get("/health", async (req, res, next) => {
  try {
    const result = await aiService.healthCheck();
    
    return res.status(result.status === "healthy" ? 200 : 500).json({
      provider: aiService.providerName,
      status: result.status,
      latency: result.latency,
      reason: result.reason || null,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/ai/test - Send raw request prompt to active provider
router.post("/test", async (req, res, next) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ success: false, message: "Prompt is required in body." });
  }

  try {
    const responseText = await aiService.testPrompt(prompt);
    return res.status(200).json({
      success: true,
      provider: aiService.providerName,
      response: responseText,
    });
  } catch (error) {
    const statusCode = error.status || error.statusCode || 500;
    return res.status(statusCode).json({
      success: false,
      provider: aiService.providerName,
      error: error.message,
    });
  }
});

module.exports = router;
