const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { protect, requireRole } = require("../middleware/auth");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiter");
const {
  validateSignupEmail,
  validateSignupPhone,
  validateLoginEmail,
  validateLoginPhone,
  validateVerifyOTP,
  validateVerifyEmail,
  validateForgotPassword,
  validateResetPassword,
  validateChangePassword,
} = require("../middleware/validation");

// Public routes
router.post("/signup/email", authLimiter, validateSignupEmail, authController.signupEmail);
router.post("/signup/phone", authLimiter, validateSignupPhone, authController.signupPhone);
router.post("/login/email", authLimiter, validateLoginEmail, authController.loginEmail);

router.post("/otp/send", otpLimiter, validateLoginPhone, authController.sendPhoneOTP);
router.post("/otp/verify", authLimiter, validateVerifyOTP, authController.verifyPhoneOTP);

router.post("/verify-email", validateVerifyEmail, authController.verifyEmail);
router.post("/forgot-password", authLimiter, validateForgotPassword, authController.forgotPassword);
router.post("/reset-password", authLimiter, validateResetPassword, authController.resetPassword);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);

// Protected routes (require authorization)
router.use(protect);

router.get("/me", authController.getMe);
router.post("/change-password", validateChangePassword, authController.changePassword);
router.post("/logout-all", authController.logoutAll);
router.get("/sessions", authController.getSessions);
router.delete("/sessions/:sessionId", authController.revokeSession);

// Admin-only routes
router.get("/admin/users", requireRole("admin"), authController.getUsers);
router.get("/admin/audit-logs", requireRole("admin"), authController.getAuditLogs);

module.exports = router;
