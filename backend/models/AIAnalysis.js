const mongoose = require("mongoose");

const AIAnalysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    resumeVersion: {
      type: Number,
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    matchScore: {
      type: Number,
      default: 0,
      index: true,
    },
    atsCompatibility: {
      type: Number,
      default: 0,
    },
    missingSkills: {
      type: [String],
      default: [],
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    resumeSuggestions: {
      type: [String],
      default: [],
    },
    personalizedCoverLetter: {
      type: String,
      default: "",
    },
    aiSummary: {
      type: String,
      default: "",
    },
    applicationSuccessProbability: {
      type: Number,
      default: 0,
    },
    interviewProbability: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly fetch cached analysis for a specific user resume version and job
AIAnalysisSchema.index({ userId: 1, resumeVersion: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model("AIAnalysis", AIAnalysisSchema);
