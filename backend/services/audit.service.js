const AuditLog = require("../models/AuditLog");
const logger = require("../config/logger");

class AuditService {
  /**
   * Log a security or system event
   */
  async logEvent({
    userId = null,
    identifier = null,
    event,
    status = "success",
    ipAddress = "Unknown IP",
    userAgent = "Unknown Agent",
    device = "Unknown Device",
    details = {},
  }) {
    try {
      // 1. Create database log
      const auditLog = await AuditLog.create({
        userId,
        identifier,
        event,
        status,
        ipAddress,
        userAgent,
        device,
        details,
      });

      // 2. Format message for file/console logging
      const logMessage = `Audit [${event.toUpperCase()}] - Status: ${status} - ID: ${
        identifier || userId || "system"
      } - IP: ${ipAddress} - Device: ${device}`;
      
      const logData = {
        auditLogId: auditLog._id,
        userId,
        identifier,
        event,
        status,
        ipAddress,
        device,
        details,
      };

      if (status === "failure" || event.includes("lockout") || event.includes("failed")) {
        logger.warn(logMessage, logData);
      } else {
        logger.info(logMessage, logData);
      }

      return auditLog;
    } catch (error) {
      // Fallback logging if DB save fails
      logger.error(`Failed to write Audit Log to DB: ${error.message}`, {
        originalEvent: { userId, identifier, event, status, ipAddress, userAgent, device, details },
        error,
      });
    }
  }

  /**
   * Retrieve audit logs with pagination and filters (useful for Admin Dashboard)
   */
  async getAuditLogs(filters = {}, options = {}) {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const logs = await AuditLog.find(filters)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "name email");

    const total = await AuditLog.countDocuments(filters);

    return {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new AuditService();
