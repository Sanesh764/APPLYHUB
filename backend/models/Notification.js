const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["application", "interview", "job_alert", "system"],
      default: "system",
      index: true,
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: { expires: 30 * 24 * 60 * 60 }, // Auto delete notification after 30 days
    },
  },
  {
    timestamps: false,
  }
);

module.exports = mongoose.model("Notification", NotificationSchema);
