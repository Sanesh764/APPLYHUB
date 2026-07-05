const ApiError = require("./errors/ApiError");
const { codeFromStatus } = require("./errors/errorCodes");

/**
 * Standard API response helpers.
 *
 * Success envelope:  { success: true,  message, data }
 * Error envelope:    { success: false, message, error: { code, message, field?, details? } }
 *
 * The error envelope is a COMPATIBLE SUPERSET: it carries the structured
 * `error` object AND mirrors the message at the top level, so existing clients
 * reading `data.message` keep working while new clients can switch on
 * `error.code` / render `error.field`.
 */

/**
 * Send a success response.
 * @param {object} res
 * @param {string} message
 * @param {*} [data]
 * @param {number} [statusCode=200]
 */
const successResponse = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response from an ApiError (or any error-like object).
 * Only whitelisted, client-safe fields are serialized — never a stack trace.
 * @param {object} res
 * @param {ApiError|Error} err
 */
const errorResponse = (res, err) => {
  const statusCode = err.statusCode || 500;

  // Prefer the structured serializer on ApiError; otherwise build a safe object.
  const error =
    err instanceof ApiError
      ? err.toResponse()
      : {
          code: err.errorCode || codeFromStatus(statusCode),
          message: err.message || "Something went wrong. Please try again later.",
          ...(err.field ? { field: err.field } : {}),
          ...(err.details ? { details: err.details } : {}),
        };

  return res.status(statusCode).json({
    success: false,
    message: error.message, // top-level mirror for backward compatibility
    error,
  });
};

/**
 * Convenience for field/validation errors.
 * @param {object} res
 * @param {string} message
 * @param {Array|object|null} [details]  e.g. [{ field, message }]
 * @param {string|null} [field]
 */
const validationResponse = (res, message, details = null, field = null) => {
  return res.status(400).json({
    success: false,
    message,
    error: {
      code: "VALIDATION_ERROR",
      message,
      ...(field ? { field } : {}),
      ...(details ? { details } : {}),
    },
  });
};

/* ------------------------------------------------------------------ *
 * Backward-compatible aliases.
 * These keep every existing call site working while emitting the new
 * standardized envelopes. `sendError` now produces the superset shape.
 * ------------------------------------------------------------------ */

/** @deprecated use successResponse */
const sendSuccess = (res, message, data = {}, statusCode = 200) =>
  successResponse(res, message, data, statusCode);

/**
 * @deprecated prefer throwing an ApiError. Kept so legacy early-returns still
 * emit the standardized error envelope. `detailsOrErrors` maps to `details`.
 */
const sendError = (res, message, statusCode = 500, detailsOrErrors = null) => {
  const err = new ApiError(message, statusCode, codeFromStatus(statusCode), {
    details: detailsOrErrors,
  });
  return errorResponse(res, err);
};

/** Standard CRUD success messages (spec #6). */
const MESSAGES = Object.freeze({
  created: "Resource created successfully.",
  updated: "Resource updated successfully.",
  deleted: "Resource deleted successfully.",
  notFound: "Requested resource was not found.",
});

module.exports = {
  successResponse,
  errorResponse,
  validationResponse,
  sendSuccess,
  sendError,
  MESSAGES,
};
