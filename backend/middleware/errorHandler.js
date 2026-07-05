const logger = require("../config/logger");
const { errorResponse } = require("../utils/response");
const {
  ApiError,
  ValidationError,
  ConflictError,
  DatabaseError,
  FileUploadError,
  TokenExpiredError,
  InvalidTokenError,
} = require("../utils/errors");

const isProduction = () => process.env.NODE_ENV === "production";

/**
 * Translate a known third-party / runtime error into a typed ApiError.
 * Returns null if the error is not recognized (caller falls back to a 500).
 */
const normalizeKnownError = (err) => {
  // Already one of ours — trust it as-is.
  if (err instanceof ApiError) return err;

  // ---- Mongoose: invalid ObjectId / cast failure ----
  if (err.name === "CastError") {
    return new ValidationError("Invalid resource ID.", err.path || null);
  }

  // ---- Mongoose: schema validation ----
  if (err.name === "ValidationError" && err.errors) {
    const details = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    const first = details[0] || {};
    return new ValidationError(
      first.message || "Validation failed.",
      first.field || null,
      details
    );
  }

  // ---- MongoDB: duplicate key ----
  if (err.code === 11000) {
    const field = err.keyValue ? Object.keys(err.keyValue)[0] : null;
    const label = field ? field.charAt(0).toUpperCase() + field.slice(1) : "Field";
    return new ConflictError(`${label} already exists.`, field);
  }

  // ---- JWT ----
  if (err.name === "TokenExpiredError") {
    return new TokenExpiredError("Session expired. Please login again.");
  }
  if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
    return new InvalidTokenError("Invalid authentication token.");
  }

  // ---- Multer (file uploads) ----
  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return new FileUploadError("File too large. Maximum allowed size is 5MB.");
    }
    if (err.code === "LIMIT_UNEXPECTED_FILE") {
      return new FileUploadError("Unexpected file field in upload.");
    }
    return new FileUploadError("File upload failed.");
  }

  // ---- Zod (defensive; validation middleware normally maps these) ----
  if (err.name === "ZodError" && Array.isArray(err.issues || err.errors)) {
    const issues = err.issues || err.errors;
    const details = issues.map((i) => ({
      field: Array.isArray(i.path) ? i.path.join(".") : i.path,
      message: i.message,
    }));
    const first = details[0] || {};
    return new ValidationError(first.message || "Validation failed.", first.field, details);
  }

  // ---- MongoDB / Mongoose connectivity & timeouts ----
  if (err.name === "MongooseServerSelectionError" || err.name === "MongoNetworkError") {
    return new DatabaseError("Unable to connect to the database.", 503);
  }
  if (err.name === "MongooseError" && /tim(ed)?\s*out/i.test(err.message || "")) {
    return new DatabaseError("Database request timed out.", 503);
  }

  // Legacy plain errors that carried a statusCode (e.g. old middleware).
  if (err.statusCode) {
    const details = err.errors || err.details || null;
    return new ApiError(err.message, err.statusCode, err.errorCode, {
      field: err.field || null,
      details,
    });
  }

  return null;
};

/**
 * Centralized error-handling middleware (must be registered LAST).
 * Normalizes any thrown value into an ApiError, logs it with context, and
 * returns the standardized error envelope. Never leaks stack traces, queries,
 * secrets, or internal paths to the client in production.
 */
// eslint-disable-next-line no-unused-vars -- Express requires the 4-arg signature
const errorHandler = (err, req, res, next) => {
  // If the response has already started, delegate to Express' default handler.
  if (res.headersSent) return next(err);

  let apiError = normalizeKnownError(err);

  // Unknown / unexpected error → generic 500, masked message.
  if (!apiError) {
    apiError = new ApiError(
      "Something went wrong. Please try again later.",
      500,
      "INTERNAL_SERVER_ERROR"
    );
    apiError.isOperational = false;
  }

  const isServerError = apiError.statusCode >= 500;

  // ---- Logging (detailed always server-side; severity by class) ----
  const logMeta = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user ? req.user.userId : null,
    statusCode: apiError.statusCode,
    code: apiError.errorCode,
    stack: err.stack,
  };

  if (isServerError) {
    logger.error(`${req.method} ${req.originalUrl} - ${err.message}`, logMeta);
  } else {
    // Client errors (4xx) are expected; log at warn without the noisy stack.
    logger.warn(`${req.method} ${req.originalUrl} - ${apiError.message}`, {
      ...logMeta,
      stack: undefined,
    });
  }

  // ---- Build client-safe response ----
  // For unexpected 5xx we never surface the real message. In development we
  // attach debug info to speed up local work; in production, nothing internal.
  if (isServerError && !apiError.isOperational) {
    apiError.message = "Something went wrong. Please try again later.";
    if (!isProduction()) {
      apiError.details = { debug: err.message, stack: err.stack };
    }
  }

  return errorResponse(res, apiError);
};

module.exports = errorHandler;
