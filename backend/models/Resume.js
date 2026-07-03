const mongoose = require("mongoose");

const ResumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    cloudinaryPublicId: {
      type: String,
    },
    version: {
      type: Number,
      default: 1,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    
    // Parsed Content (from AI parser - Stage 2)
    parsedData: {
      name: { type: String, default: "" },
      email: { type: String, default: "" },
      phone: { type: String, default: "" },
      skills: { type: [String], default: [] },
      technologies: { type: [String], default: [] },
      frameworks: { type: [String], default: [] },
      languages: { type: [String], default: [] },
      certifications: { type: [String], default: [] },
      projects: [
        {
          title: { type: String, default: "" },
          description: { type: String, default: "" },
          technologies: { type: [String], default: [] },
        },
      ],
      experience: [
        {
          company: { type: String, default: "" },
          role: { type: String, default: "" },
          startDate: { type: String, default: "" },
          endDate: { type: String, default: "" },
          description: { type: String, default: "" },
        },
      ],
      education: [
        {
          institution: { type: String, default: "" },
          degree: { type: String, default: "" },
          fieldOfStudy: { type: String, default: "" },
          graduationYear: { type: String, default: "" },
        },
      ],
      achievements: { type: [String], default: [] },
      softSkills: { type: [String], default: [] },
    },

    // ATS Analysis (Stage 4)
    atsAnalysis: {
      atsScore: { type: Number, default: 0 },
      missingSkills: { type: [String], default: [] },
      strongSkills: { type: [String], default: [] },
      weakSkills: { type: [String], default: [] },
      quality: { type: String, default: "" },
      keywordAnalysis: { type: [String], default: [] },
      grammarIssues: { type: [String], default: [] },
      formattingSuggestions: { type: [String], default: [] },
      missingSections: { type: [String], default: [] },
      industryScore: { type: Number, default: 0 },
      careerLevel: { type: String, default: "" },
      improvementSuggestions: { type: [String], default: [] },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of version number per user
ResumeSchema.index({ userId: 1, version: 1 }, { unique: true });

module.exports = mongoose.model("Resume", ResumeSchema);
