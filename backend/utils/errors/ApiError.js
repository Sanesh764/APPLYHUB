const { ERROR_CODES } = require("./errorCodes");

/**
 * Base application error.
 *
 * Every error deliberately thrown by the application should be an instance of
 * ApiError (or a subclass). This guarantees the central error handler can rely
 * on `statusCode`, `errorCode`, `field`, and `details` being present, and lets
 * it distinguish trusted "operational" errors (safe to surface to the client)
 * from unexpected programmer/runtime errors (which must be masked in prod).
 */
class ApiError extends Error {
  /**
   * @param {string} message         Human-readable, frontend-safe message.
   * @param {number} statusCode      HTTP status code.
   * @param {string} errorCode       Machine-readable code from ERROR_CODES.
   * @param {object} [options]
   * @param {string|null} [options.field]    Offending field, for form errors.
   * @param {Array|object|null} [options.details]  Extra structured detail
   *                                          (e.g. list of validation errors).
   */
  constructor(
    message,
    statusCode = 500,
    errorCode = ERROR_CODES.INTERNAL_SERVER_ERROR,
    { field = null, details = null } = {}
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.field = field;
    this.details = details;
    // Operational errors are expected failures we intentionally throw; the
    // handler trusts their messages. Non-operational errors are masked in prod.
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Serialize to the client-facing `error` object. Only whitelisted, safe
   * fields are ever included — never stack, query, path, or internals.
   */
  toResponse() {
    const error = {
      code: this.errorCode,
      message: this.message,
    };
    if (this.field) error.field = this.field;
    if (this.details) error.details = this.details;
    return error;
  }
}

module.exports = ApiError;
