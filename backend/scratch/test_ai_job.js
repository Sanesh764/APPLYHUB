require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const parserService = require("../services/parser.service");
const aiService = require("../services/ai.service");
const matchingService = require("../services/matching.service");
const cronService = require("../services/cron.service");

async function runAITests() {
  console.log("=== STARTING AI & JOB MATCHING INTEGRATION TESTS ===");

  // Connect to DB
  await connectDB();

  // 1. Seed jobs
  console.log("\n[1] Seeding jobs database...");
  await Job.deleteMany({ source: "applyhub" });
  
  const seedJobs = [
    {
      title: "Senior Full Stack Engineer (MERN)",
      companyName: "Google Tech",
      location: "Mountain View, CA",
      workMode: "hybrid",
      salary: 150000,
      description: "Looking for an expert React and Node.js developer. Candidates should know Docker, Git, Express, MongoDB and TypeScript.",
      requirements: ["React", "Node.js", "Express", "MongoDB", "TypeScript", "Docker", "Git"],
      source: "applyhub",
    },
    {
      title: "Python Data Analyst",
      companyName: "FinanceCorp",
      location: "New York, NY",
      workMode: "remote",
      salary: 95000,
      description: "Analyze market data using Python, Pandas, SQL, and Excel. Must have strong statistical knowledge.",
      requirements: ["Python", "Pandas", "SQL", "Excel"],
      source: "applyhub",
    }
  ];
  const seededJobs = await Job.create(seedJobs);
  console.log(`Seeded ${seededJobs.length} jobs.`);

  // 2. Test Parser
  console.log("\n[2] Testing Text Extraction Parser...");
  const dummyBuffer = Buffer.from("John Application\nEmail: user@applyhub.com\nSkills: JavaScript, React, Node.js, Express, Docker, Git");
  const extractedText = await parserService.extractText(dummyBuffer, "text/plain");
  console.log(`Extracted raw text length: ${extractedText.length} chars.`);
  if (!extractedText.includes("John Application")) {
    throw new Error("FAIL: Parser failed to extract plain text.");
  }

  // 3. Test AI Parsing
  console.log("\n[3] Testing AI Resume Parsing (Stage 2)...");
  const parsedResume = await aiService.parseResume(extractedText);
  console.log("AI Parsed Resume successfully. Data sample:");
  console.log(`  Name: ${parsedResume.name}`);
  console.log(`  Email: ${parsedResume.email}`);
  console.log(`  Extracted Skills: ${parsedResume.skills.join(", ")}`);

  // 4. Test Keyword Scorer
  console.log("\n[4] Testing Local Keyword Scorer (Deterministic)...");
  const keywordScore1 = matchingService.calculateKeywordScore(parsedResume, seededJobs[0]);
  const keywordScore2 = matchingService.calculateKeywordScore(parsedResume, seededJobs[1]);
  console.log(`  Match with Full Stack: ${keywordScore1}%`);
  console.log(`  Match with Data Analyst: ${keywordScore2}%`);
  if (keywordScore1 <= keywordScore2) {
    throw new Error("FAIL: Keyword scorer did not score Full Stack higher than Python Analyst.");
  }

  // 5. Test Hybrid Matching Engine
  console.log("\n[5] Testing Hybrid Matching Engine (AI + Keywords)...");
  const hybridMatch = await matchingService.calculateMatch(parsedResume, seededJobs[0]);
  console.log(`  Hybrid Match Percentage: ${hybridMatch.matchPercentage}%`);
  console.log(`  AI Match Explanation: ${hybridMatch.explanation.substring(0, 80)}...`);

  // 6. Test Cover Letter Generation
  console.log("\n[6] Testing Cover Letter Generation...");
  const coverLetter = await aiService.generateCoverLetter(
    parsedResume,
    seededJobs[0].companyName,
    seededJobs[0].title,
    seededJobs[0].description
  );
  console.log("  Cover Letter generated successfully.");
  console.log(`  Sample: ${coverLetter.substring(0, 100)}...`);

  // 7. Test Cron Automation triggers
  console.log("\n[7] Testing Automation Cron service configurations...");
  // Verify cron service initialized successfully
  if (typeof cronService.runDailyAutomation !== "function") {
    throw new Error("FAIL: cronService is missing runDailyAutomation method.");
  }
  console.log("Cron automation methods validated.");

  console.log("\n=== ALL AI & JOB MATCHING INTEGRATION TESTS PASSED! ===");
  mongoose.connection.close();
}

runAITests().catch((err) => {
  console.error("\n!!! INTEGRATION TEST SUITE FAILED !!!", err);
  mongoose.connection.close();
  process.exit(1);
});
