const rateLimit = require("express-rate-limit");
const logger = require("../config/logger");
const { errorResponse } = require("../utils/response");
const { RateLimitError } = require("../utils/errors");
const { ipKeyGenerator } = require("express-rate-limit");
// General global api rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn(`API Rate Limit Exceeded: ${req.ip} tried to access ${req.originalUrl}`);
    return errorResponse(res, new RateLimitError("Too many requests from this IP, please try again after 15 minutes."));
  },
});

// Authentication rate limiter (signup, login, password reset)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Limit each IP to 15 auth attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth Rate Limit Exceeded: ${req.ip} tried to access auth endpoint ${req.originalUrl}`);
    return errorResponse(res, new RateLimitError("Too many authentication attempts, please try again after 15 minutes."));
  },
});

// OTP resend rate limiter (extremely strict to avoid SMS abuse/costs)
const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP/phone to 5 OTP requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  validate: { ip: false },
 keyGenerator: (req) => {
    return ipKeyGenerator(req.ip) + "_" + (req.body.phone || req.body.email || "");
},
  handler: (req, res) => {
    logger.warn(`OTP Limit Exceeded: ${req.ip} requested too many OTPs for ${req.body.phone || req.body.email}`);
    return errorResponse(res, new RateLimitError("Too many OTP requests. Please wait an hour or contact support."));
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  otpLimiter,
};
