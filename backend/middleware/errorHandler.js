const logger = require("../config/logger");
const { sendError } = require("../utils/response");

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log the error stack in winston
  logger.error(`${req.method} ${req.originalUrl} - Error: ${message}`, {
    stack: err.stack,
    ip: req.ip,
    userId: req.user ? req.user.userId : null,
  });

  // If validation errors are present (e.g. from express-validator)
  if (err.errors) {
    return sendError(res, message, statusCode, err.errors);
  }

  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const mongooseErrors = Object.values(err.errors).map((e) => ({
      path: e.path,
      msg: e.message,
    }));
    return sendError(res, "Validation Error", 400, mongooseErrors);
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, `Duplicate field value entered: ${field}`, 400, [
      { path: field, msg: `The ${field} is already in use` },
    ]);
  }

  // Handle JWT errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, "Invalid token. Please log in again.", 401);
  }
  if (err.name === "TokenExpiredError") {
    return sendError(res, "Token expired. Please log in again.", 401);
  }

  // Default response
  const responseMsg = process.env.NODE_ENV === "production" ? "An unexpected error occurred" : message;
  return sendError(res, responseMsg, statusCode);
};

module.exports = errorHandler;
