/**
 * Canonical error codes and their default HTTP status mappings.
 *
 * These string codes are stable, machine-readable identifiers returned to the
 * client under `error.code`. The React frontend can switch on them without
 * parsing human-readable messages.
 */

const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  DATABASE_ERROR: "DATABASE_ERROR",
  FILE_UPLOAD_ERROR: "FILE_UPLOAD_ERROR",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN: "INVALID_TOKEN",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  BAD_REQUEST: "BAD_REQUEST",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
});

/**
 * Default HTTP status code for each error code. Used when normalizing an error
 * that only carries a code, or to derive a code from a bare status code.
 */
const STATUS_BY_CODE = Object.freeze({
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.BAD_REQUEST]: 400,
  [ERROR_CODES.FILE_UPLOAD_ERROR]: 400,
  [ERROR_CODES.AUTHENTICATION_ERROR]: 401,
  [ERROR_CODES.TOKEN_EXPIRED]: 401,
  [ERROR_CODES.INVALID_TOKEN]: 401,
  [ERROR_CODES.AUTHORIZATION_ERROR]: 403,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.CONFLICT]: 409,
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
  [ERROR_CODES.DATABASE_ERROR]: 500,
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
  [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
});

/**
 * Reverse lookup: derive a sensible error code from an HTTP status code.
 * Falls back to BAD_REQUEST for unmapped 4xx and INTERNAL_SERVER_ERROR otherwise.
 */
const codeFromStatus = (statusCode) => {
  const status = Number(statusCode) || 500;
  const match = {
    400: ERROR_CODES.BAD_REQUEST,
    401: ERROR_CODES.AUTHENTICATION_ERROR,
    403: ERROR_CODES.AUTHORIZATION_ERROR,
    404: ERROR_CODES.NOT_FOUND,
    409: ERROR_CODES.CONFLICT,
    422: ERROR_CODES.VALIDATION_ERROR,
    429: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    503: ERROR_CODES.SERVICE_UNAVAILABLE,
  }[status];
  if (match) return match;
  if (status >= 400 && status < 500) return ERROR_CODES.BAD_REQUEST;
  return ERROR_CODES.INTERNAL_SERVER_ERROR;
};

module.exports = { ERROR_CODES, STATUS_BY_CODE, codeFromStatus };
