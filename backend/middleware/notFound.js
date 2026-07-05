const { NotFoundError } = require("../utils/errors");

/**
 * Catch-all for unmatched routes. Forwards a typed 404 to the central error
 * handler so undefined endpoints return the standard error envelope.
 */
const notFoundHandler = (req, res, next) => {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
};

module.exports = notFoundHandler;
