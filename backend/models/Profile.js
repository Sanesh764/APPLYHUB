const mongoose = require("mongoose");

const ProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    preferredRole: {
      type: String,
      required: [true, "Preferred job role is required"],
      trim: true,
    },
    experienceLevel: {
      type: String,
      enum: ["entry", "mid", "senior", "lead", "executive"],
      required: [true, "Experience level is required"],
    },
    skills: {
      type: [String],
      default: [],
    },
    preferredCountries: {
      type: [String],
      default: [true,"india"],
    },
    preferredCities: {
      type: [String],
      default: [true,"pune"],
    },
    workMode: {
      type: String,
      enum: ["remote", "hybrid", "onsite", "any"],
      required: [true, "Work mode preference is required"],
    },
    expectedSalary: {
      type: Number,
      min: [0, "Expected salary cannot be negative"],
    },
    employmentType: {
      type: String,
      enum: ["full-time", "part-time", "contract", "internship"],
      required: [true, "Employment type is required"],
    },
    noticePeriod: {
      type: Number,
      default: 0, // in days, 0 = immediate
    },
    workAuthorization: {
      type: String,
      trim: true,
    },
    languages: {
      type: [String],
      default: [],
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    // @deprecated Auto-Apply was removed; ApplyHub never auto-submits
    // applications. Field retained for backward compatibility only.
    isAutomationEnabled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Profile", ProfileSchema);
