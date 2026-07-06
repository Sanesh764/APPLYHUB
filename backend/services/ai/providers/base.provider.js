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
  matchingSkills: z.array(z.string()).default([]),
  missingSkills: z.array(z.string()).default([]),
  resumeSuggestions: z.array(z.string()).default([]),
  recommendation: z.string().default(""),
  interviewReadiness: z.string().default("Not Specified"),
  difficultyLevel: z.string().default("Not Specified"),
  interviewTopics: z.array(z.string()).default([]),
  prepRoadmap: z.array(z.string()).default([]),
  learningResources: z.array(
    z.object({
      title: z.string().default(""),
      url: z.string().default(""),
    })
  ).default([]),
  requiredCertifications: z.array(z.string()).default([]),
  requiredExperienceNeeded: z.string().default(""),
});

const jobEnrichmentSchema = z.object({
  summary: z.string().default("Not Specified"),
  preferredSkills: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  companyWebsite: z.string().default("Not Specified"),
  companySize: z.string().default("Not Specified"),
  companyIndustry: z.string().default("Not Specified"),
  companyDescription: z.string().default("Not Specified"),
  benefits: z.array(z.string()).default([]),
  visaSponsorship: z.string().default("Not Specified"),
  indiaEligible: z.string().default("Not Specified"),
  isInternship: z.boolean().default(false),
  internshipDetails: z.object({
    stipend: z.string().default("Not Disclosed"),
    duration: z.string().default("Not Disclosed"),
    internshipType: z.string().default("Not Disclosed"),
    ppoAvailability: z.string().default("Not Disclosed"),
    startDate: z.string().default("Not Disclosed"),
    eligibility: z.string().default("Not Disclosed")
  }).default({}),
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
    this.jobEnrichmentSchema = jobEnrichmentSchema;
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
      matchingSkills: ["React", "Node.js", "Docker", "JavaScript", "HTML", "CSS"],
      missingSkills: ["Next.js", "GraphQL"],
      resumeSuggestions: [
        "Add a summary statement detailing your background in SaaS application development.",
        "Incorporate keywords like Next.js to increase search indexing.",
      ],
      recommendation: "Excellent match. Highlight your relevant full-stack projects.",
      interviewReadiness: "Ready",
      difficultyLevel: "Medium",
      interviewTopics: ["React performance optimization", "REST API design in Node.js", "Docker deployment"],
      prepRoadmap: [
        "Review React hooks and server components.",
        "Practice Express middleware implementation.",
        "Optimize Dockerfile multi-stage builds."
      ],
      learningResources: [
        { title: "React Official Docs", url: "https://react.dev" },
        { title: "Node.js Design Patterns", url: "https://nodejs.org" }
      ],
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

  getMockJobEnrichment(job = {}) {
    const title = job.title || "this role";
    const company = job.company || "the company";
    const isIntern = /intern/i.test(title) || /internship/i.test(job.description || "");
    return {
      summary: `${title} at ${company} is a hands-on engineering role focused on building and shipping production features. The team values strong fundamentals, ownership, and collaboration. A solid match for candidates with relevant full-stack experience looking to grow.`,
      preferredSkills: ["Docker", "CI/CD", "Cloud platforms"],
      responsibilities: Array.isArray(job.responsibilities) && job.responsibilities.length ? job.responsibilities : [
        "Develop and maintain robust web applications.",
        "Collaborate with product and design teams.",
        "Write clean, testable, and documented code."
      ],
      companyWebsite: "Not Specified",
      companySize: "Not Specified",
      companyIndustry: "Not Specified",
      companyDescription: "Not Specified",
      benefits: ["Health insurance", "Flexible working hours"],
      visaSponsorship: "Not Specified",
      indiaEligible: "Yes",
      isInternship: isIntern,
      internshipDetails: {
        stipend: isIntern ? "₹20,000 - ₹35,000 / month" : "Not Disclosed",
        duration: isIntern ? "6 months" : "Not Disclosed",
        internshipType: isIntern ? "Paid" : "Not Disclosed",
        ppoAvailability: isIntern ? "Yes" : "Not Disclosed",
        startDate: isIntern ? "Immediate" : "Not Disclosed",
        eligibility: isIntern ? "B.Tech/MCA/Equivalent" : "Not Disclosed"
      }
    };
  }

  // ---------------------------------------------------------------------------
  // Core AI Operations
  // ---------------------------------------------------------------------------
  async parseResume(rawText) {
    if (typeof this.isConfigured === "function" && !this.isConfigured()) {
      return this.getMockParsedData();
    }

    const systemInstruction = `You are a recruiting parser. Extract candidate details and format strictly to this JSON schema:
    {
      "name": "Full Name",
      "email": "Email Address",
      "phone": "Phone Number",
      "skills": ["Broad skills like Python"],
      "technologies": ["Technologies like Git, Docker"],
      "frameworks": ["Frameworks like React, Node.js"],
      "languages": ["Languages spoken"],
      "certifications": ["Certifications earned"],
      "projects": [{"title": "Project Title", "description": "Project details", "technologies": ["techs"]}],
      "experience": [{"company": "Company Name", "role": "Job Role", "startDate": "YYYY-MM", "endDate": "YYYY-MM or Present", "description": "duties"}],
      "education": [{"institution": "Institution Name", "degree": "Degree", "fieldOfStudy": "Major", "graduationYear": "YYYY"}],
      "achievements": ["Accomplishments"],
      "softSkills": ["Soft skills"]
    }`;

    try {
      const rawJson = await this.queryLLM(`Resume text to parse: \n\n${rawText}`, systemInstruction);
      return this.parsedDataSchema.parse(rawJson);
    } catch (err) {
      logger.error(`${this.name} parseResume failed, returning mock fallback: ${err.message}`);
      return this.getMockParsedData();
    }
  }

  async analyzeATS(parsedData, targetRole) {
    if (typeof this.isConfigured === "function" && !this.isConfigured()) {
      return this.getMockATSAnalysis();
    }

    const systemInstruction = `You are an ATS advisor. Analyze resume details against a target role. Format output strictly to this JSON schema:
    {
      "atsScore": 85,
      "missingSkills": ["expected skills missing"],
      "strongSkills": ["highlighted skills present"],
      "weakSkills": ["skills showing weak experience"],
      "quality": "Text summarizing impact",
      "keywordAnalysis": ["keywords to include"],
      "grammarIssues": ["grammar issues found or 'None'"],
      "formattingSuggestions": ["formatting tips"],
      "missingSections": ["missing structural blocks"],
      "industryScore": 80,
      "careerLevel": "Level description",
      "improvementSuggestions": ["actionable steps"]
    }`;

    try {
      const rawJson = await this.queryLLM(`Target Role: ${targetRole}\nProfile Data: ${JSON.stringify(parsedData)}`, systemInstruction);
      return this.atsAnalysisSchema.parse(rawJson);
    } catch (err) {
      logger.error(`${this.name} analyzeATS failed, returning mock fallback: ${err.message}`);
      return this.getMockATSAnalysis();
    }
  }

  async matchJob(parsedData, jobDescription) {
    if (typeof this.isConfigured === "function" && !this.isConfigured()) {
      return this.getMockJobMatching();
    }

    const systemInstruction = `You are a career matcher. Compare resume profile against job description. Output STRICT JSON matching this schema:
    {
      "matchPercentage": 75,
      "explanation": "concise reasons for this score, explaining why this job matches or doesn't match the candidate",
      "advantages": ["candidate strengths relative to this job"],
      "disadvantages": ["candidate gaps or weaknesses relative to this job"],
      "matchingSkills": ["skills present in the candidate resume that are also requested in the job description"],
      "missingSkills": ["skills missing from the candidate resume that are requested in the job description"],
      "resumeSuggestions": ["concrete, actionable recommendations on how the candidate can improve their resume for this job"],
      "recommendation": "main overall recommendation",
      "interviewReadiness": "interview readiness estimate: 'Ready', 'Requires Prep', or 'Not Ready'",
      "difficultyLevel": "job difficulty level: 'Entry', 'Medium', or 'Hard'",
      "interviewTopics": ["3-5 expected technical or behavioral interview topics based on the job requirements"],
      "prepRoadmap": ["3-5 step preparation roadmap tailored to this role"],
      "learningResources": [{"title": "Course/Doc Title", "url": "learning URL"}],
      "requiredCertifications": ["missing certifications requested"],
      "requiredExperienceNeeded": "explanation of experience gaps"
    }
    For empty lists, return [] instead of omitting them. Only output valid JSON.`;

    try {
      const rawJson = await this.queryLLM(`Resume Profile: ${JSON.stringify(parsedData)}\nJob Description: ${jobDescription}`, systemInstruction);
      return this.jobMatchingSchema.parse(rawJson);
    } catch (err) {
      logger.error(`${this.name} matchJob failed, returning mock fallback: ${err.message}`);
      return this.getMockJobMatching();
    }
  }

  async generateCoverLetter(parsedData, companyName, jobTitle, jobDescription) {
    if (typeof this.isConfigured === "function" && !this.isConfigured()) {
      return this.getMockCoverLetter(companyName, jobTitle);
    }

    const systemPrompt = `You are an expert career consultant. Write a professional cover letter based on the candidate's resume data and the target job. Do not use placeholder fields like [Date]; output a cohesive ready-to-use letter.`;

    try {
      return await this.queryLLMText(`Candidate Profile: ${JSON.stringify(parsedData)}\nCompany: ${companyName}\nRole: ${jobTitle}\nJob Description: ${jobDescription}`, systemPrompt);
    } catch (err) {
      logger.error(`${this.name} generateCoverLetter failed, returning mock fallback: ${err.message}`);
      return this.getMockCoverLetter(companyName, jobTitle);
    }
  }

  async generateInterviewQuestions(parsedData, jobTitle, jobDescription) {
    if (typeof this.isConfigured === "function" && !this.isConfigured()) {
      return this.getMockInterviewQuestions();
    }

    const systemPrompt = `You are an expert technical interviewer. Generate 3 highly relevant interview questions based on the candidate's resume details and the target job requirements.`;

    try {
      return await this.queryLLMText(`Candidate Profile: ${JSON.stringify(parsedData)}\nRole: ${jobTitle}\nJob Description: ${jobDescription}`, systemPrompt);
    } catch (err) {
      logger.error(`${this.name} generateInterviewQuestions failed, returning mock fallback: ${err.message}`);
      return this.getMockInterviewQuestions();
    }
  }

  async summarizeJob(job = {}) {
    if (typeof this.isConfigured === "function" && !this.isConfigured()) {
      return this.getMockJobEnrichment(job);
    }

    const systemInstruction = `You are a job-listing analyst. Read the job description and output STRICT JSON matching this schema:
    {
      "summary": "A concise 3-5 line plain-text summary of the role, team, and who it suits. No markdown.",
      "preferredSkills": ["nice-to-have skills explicitly or strongly implied by the posting"],
      "responsibilities": ["4-6 short bullet phrases of the core responsibilities"],
      "companyWebsite": "website URL if mentioned, else 'Not Specified'",
      "companySize": "company size range if mentioned (e.g. 50-100 employees), else 'Not Specified'",
      "companyIndustry": "industry of the company, else 'Not Specified'",
      "companyDescription": "brief 1-2 sentence description of the company, else 'Not Specified'",
      "benefits": ["list of benefits mentioned like health insurance, equity, etc."],
      "visaSponsorship": "visa sponsorship availability status (e.g., 'Available', 'Not Available', or 'Not Specified')",
      "indiaEligible": "whether candidates from India are eligible (e.g., 'Yes', 'No', or 'Not Specified')",
      "isInternship": true/false,
      "internshipDetails": {
        "stipend": "stipend value if internship, else 'Not Disclosed'",
        "duration": "duration of internship (e.g., '6 months'), else 'Not Disclosed'",
        "internshipType": "type of internship (e.g., 'Paid', 'Unpaid', or 'Not Disclosed')",
        "ppoAvailability": "whether PPO is available (e.g., 'Yes', 'No', or 'Not Disclosed')",
        "startDate": "start date, else 'Not Disclosed'",
        "eligibility": "eligibility criteria, else 'Not Disclosed'"
      }
    }
    For any value that is unavailable, return 'Not Specified' or 'Not Disclosed' as specified in the schema. Do not return empty values. Only output valid JSON.`;

    const prompt = `Title: ${job.title}
Company: ${job.company}
Location: ${job.location}
Employment Type: ${job.employmentType}
Known Skills: ${(job.skills || []).join(", ")}
Description: ${(job.description || "").slice(0, 4000)}`;

    try {
      const rawJson = await this.queryLLM(prompt, systemInstruction);
      return this.jobEnrichmentSchema.parse(rawJson);
    } catch (err) {
      logger.warn(`${this.name} summarizeJob failed, returning mock fallback: ${err.message}`);
      return this.getMockJobEnrichment(job);
    }
  }
}

module.exports = BaseProvider;
