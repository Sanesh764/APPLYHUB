const express = require("express");
const router = express.Router();
const systemController = require("../controllers/system.controller");

// GET /api/v1/system/health - Run parallel health diagnostic probes
router.get("/health", systemController.getSystemHealth);

module.exports = router;
