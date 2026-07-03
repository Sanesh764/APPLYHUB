const authService = require("../services/auth.service");
const tokenService = require("../services/token.service");
const auditService = require("../services/audit.service");
const { sendSuccess, sendError } = require("../utils/response");

// Helper to get client IP
const getClientIp = (req) => {
  return req.headers["x-forwarded-for"] || req.socket.remoteAddress || "Unknown IP";
};

// Helper to get client device details
const getClientDevice = (req) => {
  if (req.useragent) {
    const { browser, os, platform } = req.useragent;
    return `${browser} on ${os} (${platform})`;
  }
  return req.headers["user-agent"] || "Unknown Device";
};

// Helper to set cookie
const setRefreshTokenCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === "production";
  res.cookie("refreshToken", token, {
    httpOnly: true,
    secure: isProd, // True in production, false for local testing over HTTP
    sameSite: isProd ? "Strict" : "Lax",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days matching token expiry
  });
};

class AuthController {
  /**
   * Register User with Email
   */
  async signupEmail(req, res, next) {
    try {
      const { name, email, password } = req.body;
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "Unknown";
      const device = getClientDevice(req);

      const user = await authService.signupEmail({ name, email, password }, ip, ua, device);

      return sendSuccess(
        res,
        "Registration successful. Please check your email to verify your account.",
        { userId: user._id, email: user.email },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify Email
   */
  async verifyEmail(req, res, next) {
    try {
      const { email, token } = req.query;
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "Unknown";
      const device = getClientDevice(req);

      await authService.verifyEmail(email, token, ip, ua, device);

      return sendSuccess(res, "Email verified successfully. You can now log in.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Login User with Email
   */
  async loginEmail(req, res, next) {
    try {
      const { email, password } = req.body;
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "Unknown";
      const device = getClientDevice(req);

      const result = await authService.loginEmail({
        email,
        password,
        device,
        ipAddress: ip,
        userAgent: ua,
      });

      if (result.twoFactorRequired) {
        return sendSuccess(res, "Two-Factor authentication is required", {
          twoFactorRequired: true,
          userId: result.userId,
          email: result.email,
        });
      }

      const { user, accessToken, refreshToken } = result;

      // Set Refresh Token in secure cookie
      setRefreshTokenCookie(res, refreshToken);

      return sendSuccess(res, "Login successful", {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
        },
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Register User with Phone (Sends OTP)
   */
  async signupPhone(req, res, next) {
    try {
      const { name, email, phone } = req.body;
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "Unknown";
      const device = getClientDevice(req);

      const user = await authService.signupPhone({ name, email, phone }, ip, ua, device);

      return sendSuccess(
        res,
        "Registration successful. An OTP has been sent to your phone for verification.",
        { userId: user._id, phone: user.phone },
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Send/Resend OTP (For existing user login)
   */
  async sendPhoneOTP(req, res, next) {
    try {
      const { phone } = req.body;
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "Unknown";
      const device = getClientDevice(req);

      await authService.sendPhoneOTP(phone, ip, ua, device, "phone_verification");

      return sendSuccess(res, "OTP sent successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify Phone OTP (Complete Login/Signup)
   */
  async verifyPhoneOTP(req, res, next) {
    try {
      const { phone, code } = req.body;
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "Unknown";
      const device = getClientDevice(req);

      const { user, accessToken, refreshToken } = await authService.verifyPhoneOTP({
        phone,
        code,
        device,
        ipAddress: ip,
        userAgent: ua,
      });

      // Set cookie
      setRefreshTokenCookie(res, refreshToken);

      return sendSuccess(res, "Verification and login successful", {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isPhoneVerified: user.isPhoneVerified,
        },
        accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot Password - Request Reset Link
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "Unknown";
      const device = getClientDevice(req);

      await authService.forgotPassword(email, ip, ua, device);

      // Return general success response for security
      return sendSuccess(
        res,
        "If the email exists, a password reset link has been sent to it."
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset Password
   */
  async resetPassword(req, res, next) {
    try {
      const { email, token, newPassword } = req.body;
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "Unknown";
      const device = getClientDevice(req);

      await authService.resetPassword({ email, token, newPassword }, ip, ua, device);

      return sendSuccess(res, "Password reset successful. You can now log in with your new password.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change Password (Authenticated)
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.userId;
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "Unknown";
      const device = getClientDevice(req);

      await authService.changePassword({ userId, currentPassword, newPassword }, ip, ua, device);

      // Clear cookies upon password change since all other sessions are revoked
      res.clearCookie("refreshToken");

      return sendSuccess(res, "Password changed successfully. Please log in again.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh Token
   */
  async refreshToken(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (!refreshToken) {
        return sendError(res, "Refresh token is missing", 400);
      }

      const ip = getClientIp(req);
      const device = getClientDevice(req);

      const { accessToken, refreshToken: newRefreshToken } = await tokenService.refreshSession(
        refreshToken,
        device,
        ip
      );

      // Set cookie
      setRefreshTokenCookie(res, newRefreshToken);

      return sendSuccess(res, "Token refreshed successfully", { accessToken });
    } catch (error) {
      // Clear cookie if refresh token fails
      res.clearCookie("refreshToken");
      next(error);
    }
  }

  /**
   * Logout from Current Device
   */
  async logout(req, res, next) {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "Unknown";
      const device = getClientDevice(req);

      if (refreshToken) {
        await tokenService.revokeSession(refreshToken);
      }

      if (req.user) {
        await auditService.logEvent({
          userId: req.user.userId,
          event: "logout",
          status: "success",
          ipAddress: ip,
          userAgent: ua,
          device,
        });
      }

      res.clearCookie("refreshToken");
      return sendSuccess(res, "Logged out successfully from current device.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Logout from All Devices
   */
  async logoutAll(req, res, next) {
    try {
      const userId = req.user.userId;
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "Unknown";
      const device = getClientDevice(req);

      await tokenService.revokeAllUserSessions(userId);

      await auditService.logEvent({
        userId,
        event: "logout_all_devices",
        status: "success",
        ipAddress: ip,
        userAgent: ua,
        device,
      });

      res.clearCookie("refreshToken");
      return sendSuccess(res, "Logged out successfully from all devices.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Active Sessions / Devices
   */
  async getSessions(req, res, next) {
    try {
      const userId = req.user.userId;
      const activeSessions = await tokenService.getActiveSessions(userId);

      // Map sessions and indicate the current one
      const currentTokenHash = req.cookies.refreshToken
        ? tokenService.hashToken(req.cookies.refreshToken)
        : null;

      const sessions = activeSessions.map((session) => ({
        id: session._id,
        device: session.device,
        ipAddress: session.ipAddress,
        lastActive: session.lastActive,
        isCurrent: session.refreshTokenHash === currentTokenHash,
      }));

      return sendSuccess(res, "Active sessions retrieved successfully", { sessions });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Revoke specific session (Device)
   */
  async revokeSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.userId;
      const ip = getClientIp(req);
      const ua = req.headers["user-agent"] || "Unknown";
      const device = getClientDevice(req);

      await tokenService.revokeSessionById(sessionId, userId);

      await auditService.logEvent({
        userId,
        event: "revoke_device_session",
        status: "success",
        ipAddress: ip,
        userAgent: ua,
        device,
        details: { revokedSessionId: sessionId },
      });

      return sendSuccess(res, "Device session revoked successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Current User Profile
   */
  async getMe(req, res, next) {
    try {
      return sendSuccess(res, "User profile retrieved successfully", {
        user: {
          id: req.userDocument._id,
          name: req.userDocument.name,
          email: req.userDocument.email,
          phone: req.userDocument.phone,
          role: req.userDocument.role,
          isEmailVerified: req.userDocument.isEmailVerified,
          isPhoneVerified: req.userDocument.isPhoneVerified,
          createdAt: req.userDocument.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get all registered users
   */
  async getUsers(req, res, next) {
    try {
      const User = require("../models/User");
      const users = await User.find().sort({ createdAt: -1 });
      return sendSuccess(res, "Users retrieved successfully", { users });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get system audit logs
   */
  async getAuditLogs(req, res, next) {
    try {
      const { page, limit, event, status } = req.query;
      const filters = {};
      if (event) filters.event = event;
      if (status) filters.status = status;
      
      const result = await auditService.getAuditLogs(filters, {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      return sendSuccess(res, "Audit logs retrieved successfully", result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
