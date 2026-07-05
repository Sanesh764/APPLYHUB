const ApiError = require("./ApiError");
const { ERROR_CODES, STATUS_BY_CODE, codeFromStatus } = require("./errorCodes");

/**
 * Concrete, reusable error classes. Each pins its own HTTP status and error
 * code so call sites read cleanly, e.g. `throw new NotFoundError()`.
 */

/** 400 — invalid input. `field`/`details` help the frontend render form errors. */
class ValidationError extends ApiError {
  constructor(message = "Validation failed", field = null, details = null) {
    super(message, 400, ERROR_CODES.VALIDATION_ERROR, { field, details });
  }
}

/** 401 — bad or missing credentials. */
class AuthenticationError extends ApiError {
  constructor(message = "Authentication failed", field = null) {
    super(message, 401, ERROR_CODES.AUTHENTICATION_ERROR, { field });
  }
}

/** 403 — authenticated but not permitted. */
class AuthorizationError extends ApiError {
  constructor(message = "You do not have permission to perform this action.") {
    super(message, 403, ERROR_CODES.AUTHORIZATION_ERROR);
  }
}

/** 404 — resource does not exist. */
class NotFoundError extends ApiError {
  constructor(message = "Requested resource was not found.") {
    super(message, 404, ERROR_CODES.NOT_FOUND);
  }
}

/** 409 — conflicts with existing state (duplicate key, already exists). */
class ConflictError extends ApiError {
  constructor(message = "Resource already exists.", field = null) {
    super(message, 409, ERROR_CODES.CONFLICT, { field });
  }
}

/** 500/503 — database failure. Non-operational: message is masked in prod. */
class DatabaseError extends ApiError {
  constructor(message = "A database error occurred.", statusCode = 500) {
    super(message, statusCode, ERROR_CODES.DATABASE_ERROR);
    this.isOperational = false;
  }
}

/** 400 — file upload problems (type, size, transport). */
class FileUploadError extends ApiError {
  constructor(message = "File upload failed.", field = "file") {
    super(message, 400, ERROR_CODES.FILE_UPLOAD_ERROR, { field });
  }
}

/** 401 — expired JWT. */
class TokenExpiredError extends ApiError {
  constructor(message = "Session expired. Please login again.") {
    super(message, 401, ERROR_CODES.TOKEN_EXPIRED);
  }
}

/** 401 — malformed / invalid JWT. */
class InvalidTokenError extends ApiError {
  constructor(message = "Invalid authentication token.") {
    super(message, 401, ERROR_CODES.INVALID_TOKEN);
  }
}

/** 429 — rate limit tripped. */
class RateLimitError extends ApiError {
  constructor(message = "Too many requests. Please try again later.") {
    super(message, 429, ERROR_CODES.RATE_LIMIT_EXCEEDED);
  }
}

module.exports = {
  ApiError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  DatabaseError,
  FileUploadError,
  TokenExpiredError,
  InvalidTokenError,
  RateLimitError,
  ERROR_CODES,
  STATUS_BY_CODE,
  codeFromStatus,
};
