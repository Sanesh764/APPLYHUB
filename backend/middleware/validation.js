const { body, query, validationResult } = require("express-validator");

const checkValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation Failed");
    error.statusCode = 400;
    error.errors = errors.array().map((err) => ({
      path: err.path || err.param,
      msg: err.msg,
    }));
    return next(error);
  }
  next();
};

const strongPassword = body("password")
  .isLength({ min: 8 })
  .withMessage("Password must be at least 8 characters long")
  .matches(/[a-z]/)
  .withMessage("Password must contain at least one lowercase letter")
  .matches(/[A-Z]/)
  .withMessage("Password must contain at least one uppercase letter")
  .matches(/\d/)
  .withMessage("Password must contain at least one number")
  .matches(/[@$!%*?&#]/)
  .withMessage("Password must contain at least one special character (@, $, !, %, *, ?, &, #)");

const strongNewPassword = body("newPassword")
  .isLength({ min: 8 })
  .withMessage("New password must be at least 8 characters long")
  .matches(/[a-z]/)
  .withMessage("New password must contain at least one lowercase letter")
  .matches(/[A-Z]/)
  .withMessage("New password must contain at least one uppercase letter")
  .matches(/\d/)
  .withMessage("New password must contain at least one number")
  .matches(/[@$!%*?&#]/)
  .withMessage("New password must contain at least one special character (@, $, !, %, *, ?, &, #)");

module.exports = {
  validateSignupEmail: [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("Provide a valid email address"),
    strongPassword,
    checkValidation,
  ],
  validateSignupPhone: [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").trim().isEmail().withMessage("Provide a valid email address"),
    body("phone")
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage("Provide a valid phone number (E.164 format, e.g., +911234567890)"),
    checkValidation,
  ],
  validateLoginEmail: [
    body("email").trim().isEmail().withMessage("Provide a valid email address"),
    body("password").notEmpty().withMessage("Password is required"),
    checkValidation,
  ],
  validateLoginPhone: [
    body("phone")
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage("Provide a valid phone number (E.164 format, e.g., +911234567890)"),
    checkValidation,
  ],
  validateVerifyOTP: [
    body("phone")
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage("Provide a valid phone number"),
    body("code")
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage("OTP code must be 6 digits")
      .isNumeric()
      .withMessage("OTP code must be numeric"),
    checkValidation,
  ],
  validateVerifyEmail: [
    query("email").trim().isEmail().withMessage("Email query parameter is required"),
    query("token").trim().notEmpty().withMessage("Verification token query parameter is required"),
    checkValidation,
  ],
  validateForgotPassword: [
    body("email").trim().isEmail().withMessage("Provide a valid email address"),
    checkValidation,
  ],
  validateResetPassword: [
    body("email").trim().isEmail().withMessage("Provide a valid email address"),
    body("token").trim().notEmpty().withMessage("Reset token is required"),
    strongNewPassword,
    checkValidation,
  ],
  validateChangePassword: [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    strongNewPassword,
    checkValidation,
  ],
};
