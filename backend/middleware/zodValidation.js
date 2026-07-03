const { z } = require("zod");

/**
 * Express middleware to validate request body using a Zod schema
 * @param {z.ZodSchema} schema 
 */
const validateBody = (schema) => (req, res, next) => {
  try {
    // Parse req.body strictly
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join("."),
        msg: err.message,
      }));

      const valError = new Error("Validation Failed");
      valError.statusCode = 400;
      valError.errors = formattedErrors;
      return next(valError);
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
      const formattedErrors = error.errors.map((err) => ({
        path: err.path.join("."),
        msg: err.message,
      }));

      const valError = new Error("Query Validation Failed");
      valError.statusCode = 400;
      valError.errors = formattedErrors;
      return next(valError);
    }
    next(error);
  }
};

module.exports = {
  validateBody,
  validateQuery,
};
