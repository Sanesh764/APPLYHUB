const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    identifier: {
      type: String, // email or phone used
      index: true,
    },
    event: {
      type: String,
      required: true,
      index: true, // e.g. 'login_success', 'login_failed', 'account_lockout', 'logout', 'password_reset_request'
    },
    status: {
      type: String,
      enum: ["success", "failure"],
      required: true,
    },
    ipAddress: {
      type: String,
      default: "Unknown IP",
    },
    userAgent: {
      type: String,
      default: "Unknown Agent",
    },
    device: {
      type: String,
      default: "Unknown Device",
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // flexible metadata
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false, // timestamps not needed since we have timestamp field
  }
);

module.exports = mongoose.model("AuditLog", AuditLogSchema);
