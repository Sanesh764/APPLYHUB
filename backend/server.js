require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");
const logger = require("./config/logger");

// Handle Uncaught Exceptions
process.on("uncaughtException", (err) => {
  logger.error("UNCAUGHT EXCEPTION! Shutting down...", { error: err });
  process.exit(1);
});

// Connect to Database
connectDB().then(() => {
  // Initialize Background Jobs
  const cronService = require("./services/cron.service");
  cronService.init();
});

const port = process.env.PORT || 8080;
const server = app.listen(port, () => {
  logger.info(`ApplyHub Backend is listening on port ${port} in ${process.env.NODE_ENV || "development"} mode`);
});

// Handle Unhandled Rejections
process.on("unhandledRejection", (err) => {
  logger.error("UNHANDLED REJECTION! Shutting down gracefully...", { error: err });
  server.close(() => {
    process.exit(1);
  });
});