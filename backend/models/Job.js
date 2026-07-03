const mongoose = require("mongoose");

const JobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      index: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      index: true,
    },
    companyLogo: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      trim: true,
      index: true,
    },
    workMode: {
      type: String,
      enum: ["remote", "hybrid", "onsite"],
      required: true,
      index: true,
    },
    salary: {
      type: String,
      index: true,
    },
    experienceLevel: {
      type: String, // e.g. "Entry", "Mid", "Senior"
      index: true,
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
    },
    benefits: {
      type: [String],
      default: [],
    },
    requirements: {
      type: [String],
      default: [],
    },
    source: {
      type: String,
      default: "applyhub",
      index: true,
    },
    externalId: {
      type: String,
      index: true,
    },
    postedDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    applyUrl: {
      type: String,
      default: "",
    },
    isAutoSupported: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Text index to enable full-text searches across title, company, requirements, and description
JobSchema.index({
  title: "text",
  companyName: "text",
  description: "text",
  requirements: "text",
});

module.exports = mongoose.model("Job", JobSchema);
