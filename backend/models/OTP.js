const mongoose = require("mongoose");

const OTPSchema = new mongoose.Schema(
  {
    identifier: {
      type: String,
      required: true,
      index: true, // Can be email or phone number
    },
    codeHash: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["phone_verification", "email_verification", "2fa", "password_reset"],
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto-deletes document when expired
    },
    cooldownUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("OTP", OTPSchema);
