const mongoose = require("mongoose");
const aiService = require("../services/ai.service");
const emailService = require("../services/email.service");
const logger = require("../config/logger");

class SystemController {
  /**
   * Diagnostic System Health probe (GET /api/v1/system/health)
   */
  async getSystemHealth(req, res, next) {
    logger.info("System Health: Initiating parallel diagnostic check...");
    const startTime = Date.now();

    try {
      // 1. Concurrently run health status probes across all third-party and internal servers
      const [
        nvidiaHealth,
        deepseekHealth,
        geminiHealth,
        adzunaStatus,
        greenhouseStatus,
        leverStatus,
        arbeitnowStatus,
        remotiveStatus,
        smtpStatus,
      ] = await Promise.all([
        // NVIDIA Status
        aiService.getProviderInstance("nvidia")?.healthCheck()
          .then(r => r.status)
          .catch(() => "unhealthy") || Promise.resolve("unconfigured"),
          
        // DeepSeek Status
        aiService.getProviderInstance("deepseek")?.healthCheck()
          .then(r => r.status)
          .catch(() => "unhealthy") || Promise.resolve("unconfigured"),

        // Gemini Status
        aiService.getProviderInstance("gemini")?.healthCheck()
          .then(r => r.status)
          .catch(() => "unhealthy") || Promise.resolve("unconfigured"),

        // Adzuna (Check endpoint responds)
        fetch(`https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${process.env.ADZUNA_APP_ID || "test"}&app_key=${process.env.ADZUNA_APP_KEY || "test"}&results_per_page=1`, { signal: AbortSignal.timeout(3000) })
          .then(r => (r.status === 403 || r.ok) ? "healthy" : "unhealthy")
          .catch(() => "unhealthy"),

        // Greenhouse
        fetch("https://boards-api.greenhouse.io/v1/boards/figma/jobs", { signal: AbortSignal.timeout(3000) })
          .then(r => r.ok ? "healthy" : "unhealthy")
          .catch(() => "unhealthy"),

        // Lever
        fetch("https://api.lever.co/v0/postings/lever?mode=json", { signal: AbortSignal.timeout(3000) })
          .then(r => r.ok ? "healthy" : "unhealthy")
          .catch(() => "unhealthy"),

        // Arbeitnow
        fetch("https://www.arbeitnow.com/api/job-board-api", { signal: AbortSignal.timeout(3000) })
          .then(r => r.ok ? "healthy" : "unhealthy")
          .catch(() => "unhealthy"),

        // Remotive
        fetch("https://remotive.com/api/remote-jobs?limit=1", { signal: AbortSignal.timeout(3000) })
          .then(r => r.ok ? "healthy" : "unhealthy")
          .catch(() => "unhealthy"),

        // SMTP connection verification
        emailService.transporter.verify()
          .then(() => "healthy")
          .catch(() => "unhealthy"),
      ]);

      // MongoDB Status
      const mongoStatus = mongoose.connection.readyState === 1 ? "healthy" : "unhealthy";

      // Cloudinary Status
      let cloudinaryStatus = "healthy";
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
        cloudinaryStatus = "unconfigured";
      }

      // 2. Compute overall health metric
      const checks = [
        nvidiaHealth,
        deepseekHealth,
        geminiHealth,
        adzunaStatus,
        greenhouseStatus,
        leverStatus,
        arbeitnowStatus,
        remotiveStatus,
        mongoStatus,
        smtpStatus,
        cloudinaryStatus,
      ];

      const healthyCount = checks.filter(status => status === "healthy" || status === "connected").length;
      const overallHealthScore = Math.round((healthyCount / checks.length) * 100);

      const responseMap = {
        nvidia: nvidiaHealth,
        deepseek: deepseekHealth,
        gemini: geminiHealth,
        adzuna: adzunaStatus,
        greenhouse: greenhouseStatus,
        lever: leverStatus,
        arbeitnow: arbeitnowStatus,
        remotive: remotiveStatus,
        mongodb: mongoStatus,
        smtp: smtpStatus,
        cloudinary: cloudinaryStatus,
        overallHealthScore: `${overallHealthScore}%`,
        latency: `${Date.now() - startTime}ms`,
      };

      logger.info(`System Health: Scan completed in ${Date.now() - startTime}ms. Health Score: ${overallHealthScore}%`);
      return res.status(200).json(responseMap);
    } catch (err) {
      logger.error("System Health: Diagnostic health check failed", err);
      return res.status(500).json({
        status: "unhealthy",
        error: err.message,
      });
    }
  }
}

module.exports = new SystemController();
