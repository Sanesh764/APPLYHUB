const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const cookieParser = require("cookie-parser");
const useragent = require("express-useragent");
const { apiLimiter } = require("./middleware/rateLimiter");
const errorHandler = require("./middleware/errorHandler");
const notFoundHandler = require("./middleware/notFound");
const asyncHandler = require("./utils/asyncHandler");
const { successResponse } = require("./utils/response");
const { ValidationError } = require("./utils/errors");

// Route imports
const authRoutes = require("./routes/auth.routes");
const profileRoutes = require("./routes/profile.routes");
const resumeRoutes = require("./routes/resume.routes");
const jobRoutes = require("./routes/job.routes");
const applicationRoutes = require("./routes/application.routes");
const notificationRoutes = require("./routes/notification.routes");
const aiRoutes = require("./routes/ai.routes");
const systemRoutes = require("./routes/system.routes");

const app = express();

// 1. Security HTTP Headers

app.use(helmet());

// 2. CORS configuration (allowing credentials for secure HttpOnly cookie exchange)
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:5173",
  "http://127.0.0.1:5173","https://main.ddzv29gajckkr.amplifyapp.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error("CORS Policy Violation: Origin not allowed"), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// 3. Response Compression
app.use(compression());

// 4. Body Parsers (limits payload sizes for security)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// 5. Cookie Parser
app.use(cookieParser());

// 6. User Agent Parser (helps identify client devices)
app.use(useragent.express());

// 7. Global API Rate Limiter
app.use("/api/", apiLimiter);

// Serve static upload files
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// 8. API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/resumes", resumeRoutes);
app.use("/api/v1/jobs", jobRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/ai", aiRoutes);
app.use("/api/v1/system", systemRoutes);

// Temporary test route for SMTP validation
app.post(
  "/api/v1/test/email",
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
      throw new ValidationError("Email is required in request body.", "email");
    }

    const logger = require("./config/logger");
    const emailService = require("./services/email.service");

    logger.info(`SMTP Test: Attempting to send test email to ${email}...`);

    // Any send failure propagates to the central handler (message masked in prod).
    await emailService.sendMail({
      to: email,
      subject: "ApplyHub SMTP Test",
      text: "Hello,\n\nThis is a test email from ApplyHub.\n\nIf you received this email, SMTP has been configured successfully.\n\nRegards,\nApplyHub Team",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2563eb;">ApplyHub SMTP Test</h2>
          <p>Hello,</p>
          <p>This is a test email from ApplyHub.</p>
          <p>If you received this email, SMTP has been configured successfully.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">Regards,<br>ApplyHub Team</p>
        </div>
      `,
    });

    return successResponse(res, `SMTP Test Successful. Email sent to ${email}`);
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "UP", timestamp: new Date() });
});

// 9. Handle undefined routes (typed 404 → central handler)
app.use(notFoundHandler);

// 10. Global Error Handler (must be registered last)
app.use(errorHandler);

module.exports = app;
