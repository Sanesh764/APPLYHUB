const tokenService = require("../services/token.service");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const {
  AuthenticationError,
  AuthorizationError,
  TokenExpiredError,
  InvalidTokenError,
} = require("../utils/errors");

/**
 * Protect routes - Authentication Guard.
 * Throws typed errors that the central error handler renders consistently.
 */
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new AuthenticationError("Authorization token is required.");
  }

  try {
    // Verify Access Token (throws jwt errors on failure)
    const decoded = tokenService.verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new AuthenticationError("The user belonging to this token no longer exists.");
    }

    // Check if account is locked
    if (user.isLocked()) {
      throw new AuthorizationError("This account is locked. Please try again later.");
    }

    // Attach user payload to request
    req.user = {
      userId: user._id,
      role: user.role,
      email: user.email,
      phone: user.phone,
    };

    // Attach mongoose document if needed
    req.userDocument = user;

    next();
  } catch (error) {
    // Re-throw our own typed errors untouched.
    if (error.isOperational) throw error;
    // Map raw JWT verification failures to typed auth errors.
    if (error.name === "TokenExpiredError") {
      throw new TokenExpiredError("Session expired. Please login again.");
    }
    throw new InvalidTokenError("Invalid authentication token.");
  }
});

/**
 * Role authorization guard.
 * @param {...string} roles
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AuthorizationError(
        `Access denied. This action requires one of the following roles: ${roles.join(", ")}.`
      );
    }
    next();
  };
};

module.exports = {
  protect,
  requireRole,
};
