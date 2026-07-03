const mongoose = require("mongoose");

const SessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    refreshTokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    device: {
      type: String,
      default: "Unknown Device",
    },
    ipAddress: {
      type: String,
      default: "Unknown IP",
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to automatically purge expired sessions
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Session", SessionSchema);
