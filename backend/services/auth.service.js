const crypto = require("crypto");
const User = require("../models/User");
const OTP = require("../models/OTP");
const smsService = require("./sms.service");
const emailService = require("./email.service");
const tokenService = require("./token.service");
const auditService = require("./audit.service");

const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes lockout
const MAX_FAILED_ATTEMPTS = 5;
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes OTP expiry
const EMAIL_VERIFY_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours email verification link expiry
const COOLDOWN_MS = 60 * 1000; // 1 minute OTP resend cooldown

class AuthService {
  /**
   * Helper to hash verification codes
   */
  hashCode(code) {
    return crypto.createHash("sha256").update(code).digest("hex");
  }

  /**
   * Helper to generate a random digit OTP code
   */
  generateOTPCode(length = 6) {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Signup with Email
   */
  async signupEmail({ name, email, password }, ipAddress, userAgent, device) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await auditService.logEvent({
        identifier: email,
        event: "signup_failed",
        status: "failure",
        ipAddress,
        userAgent,
        device,
        details: { reason: "Email already registered" },
      });
      throw new Error("Email already registered");
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate email verification link
    const verificationCode = crypto.randomBytes(32).toString("hex");
    const codeHash = this.hashCode(verificationCode);

    await OTP.create({
      identifier: email,
      codeHash,
      type: "email_verification",
      expiresAt: new Date(Date.now() + EMAIL_VERIFY_EXPIRY_MS),
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationCode}&email=${encodeURIComponent(email)}`;

    // Send verification email
    await emailService.sendVerificationEmail(email, name, verificationUrl);

    await auditService.logEvent({
      userId: user._id,
      identifier: email,
      event: "signup_success",
      status: "success",
      ipAddress,
      userAgent,
      device,
    });

    return user;
  }

  /**
   * Verify email using token
   */
  async verifyEmail(email, token, ipAddress, userAgent, device) {
    const codeHash = this.hashCode(token);
    const otpRecord = await OTP.findOne({
      identifier: email,
      codeHash,
      type: "email_verification",
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      await auditService.logEvent({
        identifier: email,
        event: "email_verification_failed",
        status: "failure",
        ipAddress,
        userAgent,
        device,
        details: { reason: "Invalid or expired token" },
      });
      throw new Error("Invalid or expired verification token.");
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error("User not found.");
    }

    user.isEmailVerified = true;
    await user.save();

    await OTP.deleteOne({ _id: otpRecord._id });

    await auditService.logEvent({
      userId: user._id,
      identifier: email,
      event: "email_verified",
      status: "success",
      ipAddress,
      userAgent,
      device,
    });

    return user;
  }

  /**
   * Login with Email and Password
   */
  async loginEmail({ email, password, device, ipAddress, userAgent }) {
    const user = await User.findOne({ email }).select("+password +twoFactorSecret");
    if (!user) {
      await auditService.logEvent({
        identifier: email,
        event: "login_failed",
        status: "failure",
        ipAddress,
        userAgent,
        device,
        details: { reason: "User not found" },
      });
      throw new Error("Invalid email or password");
    }

    // Check account lockout
    if (user.isLocked()) {
      const lockRemaining = Math.ceil((user.lockUntil - Date.now()) / 1000 / 60);
      await auditService.logEvent({
        userId: user._id,
        identifier: email,
        event: "login_failed_locked",
        status: "failure",
        ipAddress,
        userAgent,
        device,
        details: { reason: `Account locked. Remaining time: ${lockRemaining}m` },
      });
      throw new Error(`This account is locked. Try again in ${lockRemaining} minutes.`);
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment failed attempts
      user.failedLoginAttempts += 1;
      let reason = "Invalid credentials";
      if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
        reason = "Max failed attempts. Account locked.";
        await auditService.logEvent({
          userId: user._id,
          identifier: email,
          event: "account_lockout",
          status: "failure",
          ipAddress,
          userAgent,
          device,
          details: { failedAttempts: user.failedLoginAttempts },
        });
      }
      await user.save();

      await auditService.logEvent({
        userId: user._id,
        identifier: email,
        event: "login_failed",
        status: "failure",
        ipAddress,
        userAgent,
        device,
        details: { reason, failedAttempts: user.failedLoginAttempts },
      });

      throw new Error("Invalid email or password");
    }

    // Reset failed login attempts on success
    if (user.failedLoginAttempts > 0 || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    // Check for Two Factor Authentication
    if (user.twoFactorEnabled) {
      // Return 2FA requirement without logging in yet
      return { twoFactorRequired: true, userId: user._id, email: user.email };
    }

    // Complete login session
    const { accessToken, refreshToken } = await tokenService.createSession(user._id, device, ipAddress);

    await auditService.logEvent({
      userId: user._id,
      identifier: email,
      event: "login_success",
      status: "success",
      ipAddress,
      userAgent,
      device,
    });

    return { user, accessToken, refreshToken };
  }

  /**
   * Send Phone Verification/Login OTP
   */
  async sendPhoneOTP(phone, ipAddress, userAgent, device, type = "phone_verification") {
    // Basic formatting or validation
    if (!phone) throw new Error("Phone number is required");

    // Check cooldown to avoid spamming
    const existingOTP = await OTP.findOne({ identifier: phone, type });
    if (existingOTP && existingOTP.cooldownUntil > new Date()) {
      const waitTime = Math.ceil((existingOTP.cooldownUntil - Date.now()) / 1000);
      throw new Error(`Please wait ${waitTime} seconds before requesting a new code.`);
    }

    // Generate a random 6-digit code
    const otpCode = this.generateOTPCode();
    const codeHash = this.hashCode(otpCode);

    // Save/Overwrite OTP
    await OTP.deleteOne({ identifier: phone, type });
    await OTP.create({
      identifier: phone,
      codeHash,
      type,
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
      cooldownUntil: new Date(Date.now() + COOLDOWN_MS),
    });

    // Send SMS
    await smsService.sendOTP(phone, otpCode);

    await auditService.logEvent({
      identifier: phone,
      event: "otp_sent",
      status: "success",
      ipAddress,
      userAgent,
      device,
      details: { type },
    });
  }

  /**
   * Register with Phone Number
   */
  async signupPhone({ name, phone, email }, ipAddress, userAgent, device) {
    if (!phone || !name || !email) throw new Error("Name, email and phone number are required");

    // Check if user already exists
    const duplicatePhone = await User.findOne({ phone });
    if (duplicatePhone) {
      throw new Error("Phone number is already associated with an account");
    }
    const duplicateEmail = await User.findOne({ email });
    if (duplicateEmail) {
      throw new Error("Email is already associated with an account");
    }

    // Create user marked as unverified for phone
    const user = await User.create({
      name,
      email,
      phone,
      isPhoneVerified: false,
    });

    // Send OTP
    await this.sendPhoneOTP(phone, ipAddress, userAgent, device, "phone_verification");

    return user;
  }

  /**
   * Verify Phone OTP and Complete login/signup
   */
  async verifyPhoneOTP({ phone, code, device, ipAddress, userAgent, type = "phone_verification" }) {
    const codeHash = this.hashCode(code);
    const otpRecord = await OTP.findOne({ identifier: phone, type });

    if (!otpRecord) {
      throw new Error("OTP expired or not found. Please request a new one.");
    }

    if (otpRecord.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: otpRecord._id });
      throw new Error("OTP expired. Please request a new one.");
    }

    if (otpRecord.attempts >= 3) {
      await OTP.deleteOne({ _id: otpRecord._id });
      await auditService.logEvent({
        identifier: phone,
        event: "otp_failed_max_attempts",
        status: "failure",
        ipAddress,
        userAgent,
        device,
      });
      throw new Error("Too many incorrect attempts. Please request a new code.");
    }

    if (otpRecord.codeHash !== codeHash) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      await auditService.logEvent({
        identifier: phone,
        event: "otp_failed",
        status: "failure",
        ipAddress,
        userAgent,
        device,
        details: { attempts: otpRecord.attempts },
      });
      throw new Error(`Incorrect code. You have ${3 - otpRecord.attempts} attempts left.`);
    }

    // OTP is valid! Clean up
    await OTP.deleteOne({ _id: otpRecord._id });

    // Find User
    const user = await User.findOne({ phone });
    if (!user) {
      throw new Error("User associated with this phone number not found.");
    }

    // Update verified flag
    if (!user.isPhoneVerified) {
      user.isPhoneVerified = true;
      await user.save();
    }

    // Complete login session
    const { accessToken, refreshToken } = await tokenService.createSession(user._id, device, ipAddress);

    await auditService.logEvent({
      userId: user._id,
      identifier: phone,
      event: "login_success_phone",
      status: "success",
      ipAddress,
      userAgent,
      device,
    });

    return { user, accessToken, refreshToken };
  }

  /**
   * Request Password Reset Link
   */
  async forgotPassword(email, ipAddress, userAgent, device) {
    const user = await User.findOne({ email });
    // For security, do not disclose if email exists or not. Simply return success.
    if (!user) {
      await auditService.logEvent({
        identifier: email,
        event: "password_reset_request_ignored",
        status: "failure",
        ipAddress,
        userAgent,
        device,
        details: { reason: "Email not found" },
      });
      return true;
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const codeHash = this.hashCode(resetToken);

    // Expire resets in 15 minutes
    await OTP.deleteOne({ identifier: email, type: "password_reset" });
    await OTP.create({
      identifier: email,
      codeHash,
      type: "password_reset",
      expiresAt: new Date(Date.now() + LOCK_TIME_MS),
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;

    await emailService.sendPasswordResetEmail(email, user.name, resetUrl);

    await auditService.logEvent({
      userId: user._id,
      identifier: email,
      event: "password_reset_requested",
      status: "success",
      ipAddress,
      userAgent,
      device,
    });

    return true;
  }

  /**
   * Reset Password with token
   */
  async resetPassword({ email, token, newPassword }, ipAddress, userAgent, device) {
    const codeHash = this.hashCode(token);
    const otpRecord = await OTP.findOne({
      identifier: email,
      codeHash,
      type: "password_reset",
    });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      await auditService.logEvent({
        identifier: email,
        event: "password_reset_failed",
        status: "failure",
        ipAddress,
        userAgent,
        device,
        details: { reason: "Invalid or expired reset token" },
      });
      throw new Error("Invalid or expired reset link.");
    }

    const user = await User.findOne({ email });
    if (!user) throw new Error("User not found.");

    user.password = newPassword;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    // Revoke OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    // Revoke all sessions for security reasons upon password change
    await tokenService.revokeAllUserSessions(user._id);

    await auditService.logEvent({
      userId: user._id,
      identifier: email,
      event: "password_reset_success",
      status: "success",
      ipAddress,
      userAgent,
      device,
    });

    return true;
  }

  /**
   * Change Password (while logged in)
   */
  async changePassword({ userId, currentPassword, newPassword }, ipAddress, userAgent, device) {
    const user = await User.findById(userId).select("+password");
    if (!user) throw new Error("User not found");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      await auditService.logEvent({
        userId,
        event: "password_change_failed",
        status: "failure",
        ipAddress,
        userAgent,
        device,
        details: { reason: "Incorrect current password" },
      });
      throw new Error("Current password is incorrect");
    }

    user.password = newPassword;
    await user.save();

    // Revoke all sessions on password change
    await tokenService.revokeAllUserSessions(userId);

    await auditService.logEvent({
      userId,
      event: "password_change_success",
      status: "success",
      ipAddress,
      userAgent,
      device,
    });

    return true;
  }
}

module.exports = new AuthService();
