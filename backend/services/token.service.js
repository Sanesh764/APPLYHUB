const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const Session = require("../models/Session");
const logger = require("../config/logger");

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "applyhub_access_secret_key_123456";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "applyhub_refresh_secret_key_654321";
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || "15m";
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || "7d";


class TokenService {
  /**
   * Hash a refresh token to securely store it in the database
   */
  hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  /**
   * Generate access token
   */
  generateAccessToken(payload) {
    return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
  }

  /**
   * Create a new session and save it in the database
   */
  async createSession(userId, device, ipAddress) {
    // Generate fresh tokens
    const userPayload = { userId: userId.toString() };
    const accessToken = this.generateAccessToken(userPayload);
    const refreshToken = this.generateRefreshToken(userPayload);

    // Save session in DB
    const refreshTokenHash = this.hashToken(refreshToken);
    const decodedRefresh = jwt.decode(refreshToken);
    const expiresAt = new Date(decodedRefresh.exp * 1000);

    const session = await Session.create({
      userId,
      refreshTokenHash,
      device,
      ipAddress,
      expiresAt,
    });

    return {
      accessToken,
      refreshToken,
      session,
    };
  }

  /**
   * Refresh a session (Token Rotation)
   * If a refresh token is reused, we revoke all sessions for that user as a security measure.
   */
  async refreshSession(refreshToken, device, ipAddress) {
    try {
      const decoded = jwt.verify(refreshToken, REFRESH_SECRET);
      const tokenHash = this.hashToken(refreshToken);

      // Find the session in the database
      const session = await Session.findOne({ refreshTokenHash: tokenHash });

      if (!session || !session.isValid) {
        // Reuse detection: if token is verified but session doesn't exist or is invalid,
        // it means this token might have been stolen and reused. Revoke all user sessions.
        if (decoded.userId) {
          logger.warn(`Security warning: Potential Refresh Token reuse detected for user ${decoded.userId}. Revoking all sessions.`);
          await Session.deleteMany({ userId: decoded.userId });
        }
        throw new Error("Invalid or revoked session. Please log in again.");
      }

      // Generate a new token pair
      const userPayload = { userId: session.userId.toString() };
      const newAccessToken = this.generateAccessToken(userPayload);
      const newRefreshToken = this.generateRefreshToken(userPayload);
      const newHash = this.hashToken(newRefreshToken);

      const decodedRefresh = jwt.decode(newRefreshToken);
      const expiresAt = new Date(decodedRefresh.exp * 1000);

      // Update current session with new token details (Rotation)
      session.refreshTokenHash = newHash;
      session.device = device || session.device;
      session.ipAddress = ipAddress || session.ipAddress;
      session.lastActive = new Date();
      session.expiresAt = expiresAt;
      await session.save();

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        session,
      };
    } catch (err) {
      logger.error("Token refresh failed:", err.message);
      throw new Error(err.message || "Failed to refresh token");
    }
  }

  /**
   * Verify an access token
   */
  verifyAccessToken(token) {
    return jwt.verify(token, ACCESS_SECRET);
  }

  /**
   * Revoke a specific session (Logout from device)
   */
  async revokeSession(refreshToken) {
    const tokenHash = this.hashToken(refreshToken);
    await Session.deleteOne({ refreshTokenHash: tokenHash });
  }

  /**
   * Revoke a specific session by ID (Manual device logout)
   */
  async revokeSessionById(sessionId, userId) {
    await Session.deleteOne({ _id: sessionId, userId });
  }

  /**
   * Revoke all sessions for a user (Logout from all devices)
   */
  async revokeAllUserSessions(userId) {
    await Session.deleteMany({ userId });
  }

  /**
   * Get all active sessions for a user
   */
  async getActiveSessions(userId) {
    return Session.find({ userId, isValid: true }).sort({ lastActive: -1 });
  }
}

module.exports = new TokenService();
