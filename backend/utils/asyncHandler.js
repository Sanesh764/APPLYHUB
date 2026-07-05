/**
 * Wraps an async Express route/middleware so any rejected promise (thrown
 * error) is forwarded to `next()` and reaches the central error handler.
 *
 * This removes the need for a manual try/catch in every controller. Express 5
 * already forwards async rejections, but wrapping explicitly keeps intent clear
 * and remains correct regardless of Express version.
 *
 * @example
 *   router.get("/", asyncHandler(async (req, res) => { ... }));
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
