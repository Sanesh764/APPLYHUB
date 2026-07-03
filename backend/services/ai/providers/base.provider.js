const { z } = require("zod");
const logger = require("../../../config/logger");

// -----------------------------------------------------------------------------
// Shared Zod Validation Schemas
// -----------------------------------------------------------------------------
const parsedDataSchema = z.object({
  name: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  skills: z.array(z.string()).default([]),
  technologies: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  projects: z
    .array(
      z.object({
        title: z.string().default(""),
        description: z.string().default(""),
        technologies: z.array(z.string()).default([]),
      })
    )
    .default([]),
  experience: z
    .array(
      z.object({
        company: z.string().default(""),
        role: z.string().default(""),
        startDate: z.string().default(""),
        endDate: z.string().default(""),
        description: z.string().default(""),
      })
    )
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string().default(""),
        degree: z.string().default(""),
        fieldOfStudy: z.string().default(""),
        graduationYear: z.string().default(""),
      })
    )
    .default([]),
  achievements: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
});

const atsAnalysisSchema = z.object({
  atsScore: z.number().min(0).max(100).default(0),
  missingSkills: z.array(z.string()).default([]),
  strongSkills: z.array(z.string()).default([]),
  weakSkills: z.array(z.string()).default([]),
  quality: z.string().default(""),
  keywordAnalysis: z.array(z.string()).default([]),
  grammarIssues: z.array(z.string()).default([]),
  formattingSuggestions: z.array(z.string()).default([]),
  missingSections: z.array(z.string()).default([]),
  industryScore: z.number().min(0).max(100).default(0),
  careerLevel: z.string().default(""),
  improvementSuggestions: z.array(z.string()).default([]),
});

const jobMatchingSchema = z.object({
  matchPercentage: z.number().min(0).max(100).default(0),
  explanation: z.string().default(""),
  advantages: z.array(z.string()).default([]),
  disadvantages: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  requiredCertifications: z.array(z.string()).default([]),
  requiredExperienceNeeded: z.string().default(""),
});

// -----------------------------------------------------------------------------
// Base Provider Class
// -----------------------------------------------------------------------------
class BaseProvider {
  constructor(name) {
    this.name = name;
    this.parsedDataSchema = parsedDataSchema;
    this.atsAnalysisSchema = atsAnalysisSchema;
    this.jobMatchingSchema = jobMatchingSchema;
  }

  isPlaceholderKey(key) {
    if (!key) return true;
    const lowerKey = key.toLowerCase();
    return (
      lowerKey.includes("your_") ||
      lowerKey.includes("placeholder") ||
      lowerKey === "" ||
      lowerKey.startsWith("api_key")
    );
  }

  cleanJSONString(str) {
    let cleaned = str.trim();
    const startIdx = cleaned.indexOf("{");
    const endIdx = cleaned.lastIndexOf("}");
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    } else if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    }
    return cleaned;
  }

  // ---------------------------------------------------------------------------
  // Shared Mock Fallbacks
  // ---------------------------------------------------------------------------
  getMockParsedData() {
    return {
      name: "John Application",
      email: "user@applyhub.com",
      phone: "+1234567890",
      skills: ["JavaScript", "Python", "TypeScript", "AWS", "SQL"],
      technologies: ["Git", "Docker", "PostgreSQL", "GitHub Actions"],
      frameworks: ["React", "Node.js", "Express", "TailwindCSS"],
      languages: ["English (Native)", "German (Conversational)"],
      certifications: ["AWS Certified Developer", "Scrum Master (CSM)"],
      projects: [
        {
          title: "ApplyHub Job Platform",
          description: "Built an AI-powered job application system using React and Node.js.",
          technologies: ["React", "Express", "MongoDB", "TailwindCSS"],
        },
      ],
      experience: [
        {
          company: "Tech Solutions Inc.",
          role: "Software Engineer",
          startDate: "2024-01",
          endDate: "Present",
          description: "Developed and maintained responsive web applications, optimizing API latency by 30%.",
        },
      ],
      education: [
        {
          institution: "University of Technology",
          degree: "Bachelor of Science",
          fieldOfStudy: "Computer Science",
          graduationYear: "2023",
        },
      ],
      achievements: ["Delivered 3 major client projects ahead of schedule", "Awarded Hackathon Winner 2023"],
      softSkills: ["Teamwork", "Problem Solving", "Agile methodologies"],
    };
  }

  getMockATSAnalysis() {
    return {
      atsScore: 78,
      missingSkills: ["Kubernetes", "Next.js", "GraphQL"],
      strongSkills: ["JavaScript", "React", "Node.js", "AWS", "Docker"],
      weakSkills: ["Python", "SQL"],
      quality: "Excellent layout with strong achievements and project listings. Needs more metrics in the experience description.",
      keywordAnalysis: ["CI/CD pipelines", "RESTful APIs", "Microservices", "State management"],
      grammarIssues: ["None detected."],
      formattingSuggestions: ["Shorten paragraphs in experience section.", "Ensure dates use consistent formatting."],
      missingSections: ["Professional Summary section is missing."],
      industryScore: 82,
      careerLevel: "Mid-level Developer",
      improvementSuggestions: [
        "Add a summary statement detailing your background in SaaS application development.",
        "Incorporate keywords like Kubernetes and Next.js to increase search indexing.",
        "Add quantifiable metrics to your experience bullets (e.g., 'scaled systems to 50k users').",
      ],
    };
  }

  getMockJobMatching() {
    return {
      matchPercentage: 85,
      explanation: "The candidate shows strong alignment in core stack requirements including React, Node.js, and Docker. Minor gaps in Next.js and deployment specifications.",
      advantages: [
        "Extensive experience with React and Node.js APIs.",
        "Possesses AWS Cloud Certified developer credential.",
        "Solid project work demonstrating clean-code principles.",
      ],
      disadvantages: [
        "No explicit experience with Next.js is mentioned.",
        "Lacks microservices scale records.",
      ],
      missingSkills: ["Next.js", "GraphQL"],
      requiredCertifications: ["None required."],
      requiredExperienceNeeded: "The job requests 3 years of experience. The candidate lists ~2 years.",
    };
  }

  getMockCoverLetter(companyName, jobTitle) {
    return `Dear Hiring Manager,

I am writing to express my enthusiastic interest in the ${jobTitle} position at ${companyName}, as advertised. With my solid background in Software Engineering, hands-on experience building full-stack MERN products, and active AWS Developer certification, I am excited about the opportunity to contribute to your team.

At Tech Solutions Inc., I engineered backend APIs using Node.js and Express, built interactive frontend views with React and TailwindCSS, and optimized database queries in PostgreSQL, achieving a 30% reduction in response latency. Furthermore, my project experience includes building automated AI agents and containerizing deployments using Docker, preparing me well for the scaling challenges at ${companyName}.

I am passionate about building clean, performant applications and look forward to discussing how my experience fits your requirements. Thank you for your time and consideration.

Sincerely,
John Application`;
  }

  getMockInterviewQuestions() {
    return [
      "Explain the event loop in Node.js and how asynchronous operations are managed.",
      "How do you design a database schema to prevent circular references in Mongoose?",
      "Can you walk us through the security measures you implemented in the authentication layer of ApplyHub?",
    ].join("\n\n");
  }
}

module.exports = BaseProvider;
