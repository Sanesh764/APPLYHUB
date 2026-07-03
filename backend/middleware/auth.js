const tokenService = require("../services/token.service");
const User = require("../models/User");
const { sendError } = require("../utils/response");

/**
 * Protect routes - Authentication Guard
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return sendError(res, "Not authorized to access this route", 401);
  }

  try {
    // Verify Access Token
    const decoded = tokenService.verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return sendError(res, "The user belonging to this token no longer exists", 401);
    }

    // Check if account is locked
    if (user.isLocked()) {
      return sendError(res, "This user account is locked", 403);
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
    if (error.name === "TokenExpiredError") {
      return sendError(res, "Token expired. Please refresh your token.", 401);
    }
    return sendError(res, "Not authorized to access this route", 401);
  }
};

/**
 * Role authorization guard
 * @param {...string} roles 
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(
        res,
        `User role '${req.user ? req.user.role : "none"}' is not authorized to access this route`,
        403
      );
    }
    next();
  };
};

module.exports = {
  protect,
  requireRole,
};
