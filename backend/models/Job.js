const mongoose = require("mongoose");

/**
 * Job — a cached, enriched listing aggregated from an external provider.
 */
const JobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, index: true },
    company: { type: String, required: true, trim: true, index: true },
    logo: { type: String, default: "" },

    location: { type: String, default: "Not Specified", index: true },
    remoteType: {
      type: String,
      enum: ["remote", "hybrid", "onsite"],
      default: "onsite",
      index: true,
    },
    employmentType: { type: String, default: "Not Specified", index: true },
    experience: { type: String, default: "Not Specified" },

    // Salary — display string plus numeric bounds for filtering/sorting.
    salary: { type: String, default: "Not Specified" },
    salaryMin: { type: Number, default: null, index: true },
    salaryMax: { type: Number, default: null },
    currency: { type: String, default: "" },

    skills: { type: [String], default: [] },
    preferredSkills: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
    education: { type: String, default: "Not Specified" },
    responsibilities: { type: [String], default: [] },

    summary: { type: String, default: "" }, // AI-generated summary
    description: { type: String, required: true },

    // Company Info
    companyWebsite: { type: String, default: "Not Specified" },
    companySize: { type: String, default: "Not Specified" },
    companyIndustry: { type: String, default: "Not Specified" },
    companyDescription: { type: String, default: "Not Specified" },

    // Benefits & Eligibility
    benefits: { type: [String], default: [] },
    visaSponsorship: { type: String, default: "Not Specified" },
    indiaEligible: { type: String, default: "Not Specified" },

    // Internship details
    isInternship: { type: Boolean, default: false, index: true },
    internshipDetails: {
      stipend: { type: String, default: "Not Disclosed" },
      duration: { type: String, default: "Not Disclosed" },
      internshipType: { type: String, default: "Not Disclosed" },
      ppoAvailability: { type: String, default: "Not Disclosed" },
      startDate: { type: String, default: "Not Disclosed" },
      eligibility: { type: String, default: "Not Disclosed" }
    },

    source: { type: String, required: true, index: true },
    externalId: { type: String, required: true, index: true },
    applyUrl: { type: String, default: "" },

    postedAt: { type: Date, default: Date.now, index: true },

    // Cross-provider duplicate identity + cache lifecycle bookkeeping.
    dedupKey: { type: String, index: true },
    aiEnrichedAt: { type: Date, default: null },
    lastFetchedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

// One canonical record per (source, externalId).
JobSchema.index({ source: 1, externalId: 1 }, { unique: true });

// Full-text search across the important text fields.
JobSchema.index({
  title: "text",
  company: "text",
  description: "text",
  skills: "text",
});

module.exports = mongoose.model("Job", JobSchema);
