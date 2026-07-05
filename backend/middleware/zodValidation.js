const { z } = require("zod");
const { ValidationError } = require("../utils/errors");

/**
 * Map a ZodError into our standardized ValidationError (400) carrying the
 * first field/message at the top level and the full list under `details`.
 */
const toValidationError = (error) => {
  const details = error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
  const first = details[0] || { field: null, message: "Validation failed." };
  return new ValidationError(first.message, first.field, details);
};

/**
 * Express middleware to validate request body using a Zod schema
 * @param {z.ZodSchema} schema
 */
const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(toValidationError(error));
    }
    next(error);
  }
};

/**
 * Express middleware to validate request query parameters using a Zod schema
 * @param {z.ZodSchema} schema
 */
const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(toValidationError(error));
    }
    next(error);
  }
};

module.exports = {
  validateBody,
  validateQuery,
};
