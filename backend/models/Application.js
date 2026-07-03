const mongoose = require("mongoose");

const ApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["saved", "applied", "pending", "interview", "rejected", "offer"],
      default: "saved",
      index: true,
    },
    coverLetter: {
      type: String,
      default: "",
    },
    history: [
      {
        status: {
          type: String,
          required: true,
        },
        notes: {
          type: String,
          default: "",
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    appliedAt: {
      type: Date,
    },
    resumeVersion: {
      type: Number,
      default: 1,
    },
    matchScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure a user only applies once to a given job (prevents duplicates)
ApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model("Application", ApplicationSchema);
