require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const connectDB = require("../config/db");
const User = require("../models/User");
const Profile = require("../models/Profile");
const Resume = require("../models/Resume");
const Job = require("../models/Job");
const Application = require("../models/Application");

// Services
const parserService = require("../services/parser.service");
const aiService = require("../services/ai.service");
const matchingService = require("../services/matching.service");
const jobProviderService = require("../services/jobProvider.service");
const storageService = require("../services/storage.service");
const notificationService = require("../services/notification.service");
const cronService = require("../services/cron.service");

async function verifyAll() {
  console.log("==================================================");
  console.log("    APPLYHUB E2E SYSTEM INTEGRATION TEST SUITE     ");
  console.log("==================================================");

  await connectDB();

  // Test status grid
  const statusGrid = {
    searchProviders: "FAIL",
    resumeUpload: "FAIL",
    resumeParsing: "FAIL",
    aiAnalysis: "FAIL",
    jobMatching: "FAIL",
    coverLetter: "FAIL",
    applicationTracker: "FAIL",
    emailDelivery: "FAIL",
    cloudinary: "FAIL",
    cronJobs: "FAIL",
  };

  // Helper to download sample PDF
  const samplePdfPath = path.join(__dirname, "sample.pdf");
  console.log("\n[Prep] Downloading clean W3C sample PDF for tests...");
  try {
    const res = await fetch("https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf");
    const ab = await res.arrayBuffer();
    fs.writeFileSync(samplePdfPath, Buffer.from(ab));
    console.log("  Sample PDF downloaded successfully.");
  } catch (err) {
    console.error("  Failed to download sample PDF:", err.message);
  }

  // 1 & 2. Search React Developer & Node.js Developer
  console.log("\n[1] Querying job aggregator: 'React Developer'...");
  let reactJobs = [];
  try {
    reactJobs = await jobProviderService.searchJobs({ query: "React Developer" });
    console.log(`  Found ${reactJobs.length} jobs.`);
    if (reactJobs.length > 0) {
      console.log("  Top 3 results:");
      reactJobs.slice(0, 3).forEach((j, i) => {
        console.log(`    ${i+1}. ${j.title} at ${j.companyName} [Provider: ${j.source}] - apply: ${j.applyUrl ? "Yes" : "No"}`);
      });
    }
  } catch (err) {
    console.error("  Search React Developer failed:", err.message);
  }

  console.log("\n[2] Querying job aggregator: 'Node.js Developer'...");
  let nodeJobs = [];
  try {
    nodeJobs = await jobProviderService.searchJobs({ query: "Node.js Developer" });
    console.log(`  Found ${nodeJobs.length} jobs.`);
    
    // Count providers
    const counts = {};
    nodeJobs.forEach((j) => {
      counts[j.source] = (counts[j.source] || 0) + 1;
    });
    console.log("  Provider Breakdown:", counts);
    
    if (nodeJobs.length > 0) {
      statusGrid.searchProviders = "PASS";
    }
  } catch (err) {
    console.error("  Search Node.js Developer failed:", err.message);
  }

  // 3. Duplicate check verification
  console.log("\n[3] Checking search de-duplication...");
  const uniqueKeys = new Set();
  let duplicatesFound = false;
  nodeJobs.forEach((j) => {
    const key = `${j.title.toLowerCase().trim()}_${j.companyName.toLowerCase().trim()}`;
    if (uniqueKeys.has(key)) {
      duplicatesFound = true;
    }
    uniqueKeys.add(key);
  });
  console.log(`  De-duplication audit: ${duplicatesFound ? "❌ Duplicate listings found!" : "✅ No duplicates detected in aggregated results."}`);

  // 4. Cloudinary storage check
  console.log("\n[4] Uploading test PDF to Cloudinary...");
  let uploadedFile = null;
  if (fs.existsSync(samplePdfPath)) {
    try {
      const buffer = fs.readFileSync(samplePdfPath);
      uploadedFile = await storageService.uploadFile(buffer, "test_resume.pdf", "application/pdf");
      console.log(`  Cloudinary Upload successful. URL: ${uploadedFile.url}`);
      statusGrid.cloudinary = "PASS";
      statusGrid.resumeUpload = "PASS";
    } catch (err) {
      console.error("  Cloudinary upload test failed:", err.message);
    }
  } else {
    console.log("  Skipping upload: sample PDF missing.");
  }

  // 5 & 6. PDF parsing & AI schema structures
  console.log("\n[5] Parsing PDF via ParserService...");
  let rawText = "";
  if (fs.existsSync(samplePdfPath)) {
    try {
      const buffer = fs.readFileSync(samplePdfPath);
      rawText = await parserService.extractText(buffer, "application/pdf");
      console.log(`  Extracted raw text: "${rawText.trim()}"`);
    } catch (err) {
      console.error("  ParserService extractText failed:", err.message);
    }
  }

  console.log("\n[6] Sending extracted text to active AI Provider...");
  let parsedResume = null;
  if (rawText) {
    try {
      parsedResume = await aiService.parseResume(rawText);
      console.log(`  AI Parsed Name: ${parsedResume.name}`);
      console.log(`  AI Parsed Skills: ${parsedResume.skills.join(", ")}`);
      statusGrid.resumeParsing = "PASS";
    } catch (err) {
      console.error("  AI parsing failed:", err.message);
    }
  }

  // 7. ATS Analysis & matching
  console.log("\n[7] Checking AI ATS score evaluations...");
  let atsAnalysis = null;
  if (parsedResume) {
    try {
      atsAnalysis = await aiService.analyzeATS(parsedResume, "React Developer");
      console.log(`  ATS Score: ${atsAnalysis.atsScore}/100`);
      console.log(`  Improvement suggestions count: ${atsAnalysis.improvementSuggestions.length}`);
      statusGrid.aiAnalysis = "PASS";
    } catch (err) {
      console.error("  AI ATS evaluation failed:", err.message);
    }
  }

  // 8. Hybrid Match score & cover letter
  console.log("\n[8] Testing Job Match & Cover letter compile...");
  let matchDetails = null;
  let sampleJobForMatch = reactJobs[0];
  if (!sampleJobForMatch) {
    // Seeding dummy job if search was empty
    sampleJobForMatch = {
      title: "React Developer",
      companyName: "Google Tech",
      description: "We require React and JavaScript skills.",
      requirements: ["React", "JavaScript"],
      applyUrl: "https://google.com/apply",
      source: "greenhouse",
      externalId: "gh_test_123",
      workMode: "remote"
    };
  }

  if (parsedResume) {
    try {
      matchDetails = await matchingService.calculateMatch(parsedResume, sampleJobForMatch);
      console.log(`  Match Percentage: ${matchDetails.matchPercentage}%`);
      statusGrid.jobMatching = "PASS";

      const coverLetter = await aiService.generateCoverLetter(
        parsedResume,
        sampleJobForMatch.companyName,
        sampleJobForMatch.title,
        sampleJobForMatch.description
      );
      console.log(`  AI Cover Letter pre-compiled. Length: ${coverLetter.length} chars.`);
      statusGrid.coverLetter = "PASS";
    } catch (err) {
      console.error("  AI match/cover-letter compile failed:", err.message);
    }
  }

  // 9 & 10. Save application pipeline and confirm MongoDB schema fields
  console.log("\n[9] Recording test application in MongoDB pipeline...");
  try {
    // First save the job to local DB to obtain ObjectID for reference
    const savedJob = await Job.findOneAndUpdate(
      { source: sampleJobForMatch.source, externalId: sampleJobForMatch.externalId || "test_123" },
      { $set: sampleJobForMatch },
      { upsert: true, new: true }
    );

    // Create a dummy user for verification
    const testEmail = process.env.SMTP_USER || "test_e2e@applyhub.com";
    let testUser = await User.findOne({ email: testEmail });
    if (!testUser) {
      testUser = await User.create({
        name: "Test E2E User",
        email: testEmail,
        password: "Password123!",
        isEmailVerified: true,
      });
    }

    // Clear old app to avoid index conflicts
    await Application.deleteMany({ userId: testUser._id });

    // Save application
    const app = await Application.create({
      userId: testUser._id,
      jobId: savedJob._id,
      status: "applied",
      coverLetter: "This is a cover letter",
      resumeVersion: 2,
      matchScore: 88,
      appliedAt: new Date(),
    });

    console.log("  Application successfully written to MongoDB:");
    console.log(`    ID: ${app._id}`);
    console.log(`    Status: ${app.status} (Expected: applied)`);
    console.log(`    Linked Resume Version: ${app.resumeVersion}`);
    console.log(`    Saved Match Score: ${app.matchScore}`);

    if (app.status === "applied" && app.resumeVersion === 2 && app.matchScore === 88) {
      statusGrid.applicationTracker = "PASS";
    }

  } catch (err) {
    console.error("  Application recording test failed:", err.message);
  }

  // 11. SMTP Email Delivery transaction
  console.log("\n[10] Dispatching SMTP application email...");
  try {
    const testEmail = process.env.SMTP_USER || "test_e2e@applyhub.com";
    const testUser = await User.findOne({ email: testEmail });
    if (testUser) {
      await notificationService.sendApplicationConfirmationEmail(
        testUser._id,
        sampleJobForMatch,
        "applied",
        2,
        "Sample cover letter content"
      );
      console.log(`  SMTP Outbound triggered. Transaction logged successfully.`);
      statusGrid.emailDelivery = "PASS";
    } else {
      console.log("  Skipped SMTP: missing test user or SMTP configuration.");
    }
  } catch (err) {
    console.error("  SMTP Email trigger failed:", err.message);
  }

  // 12. Cron service scan verification
  console.log("\n[11] Testing cron daily discovery sweeps configurations...");
  try {
    const summaries = await cronService.runDailyAutomation();
    console.log(`  Cron scanned. Profiles processed summary:`, summaries);
    statusGrid.cronJobs = "PASS";
  } catch (err) {
    console.error("  Cron scanning test failed:", err.message);
  }

  // Cleanup Cloudinary file
  if (uploadedFile && uploadedFile.publicId) {
    try {
      await storageService.deleteFile(uploadedFile.publicId);
      console.log("  Cleaned up Cloudinary test file.");
    } catch (e) {
      console.log("  Cloudinary cleanup failed.");
    }
  }

  // Cleanup temporary pdf file
  if (fs.existsSync(samplePdfPath)) {
    fs.unlinkSync(samplePdfPath);
  }

  // Output formatting report
  console.log("\n==================================================");
  console.log("           FINAL VERIFICATION REPORT             ");
  console.log("==================================================");
  
  const keys = Object.keys(statusGrid);
  let passes = 0;
  keys.forEach((k) => {
    const label = k.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
    const pads = ".".repeat(25 - label.length);
    console.log(`${label} ${pads} ${statusGrid[k]}`);
    if (statusGrid[k] === "PASS") passes++;
  });

  const overallScore = Math.round((passes / keys.length) * 100);
  console.log("--------------------------------------------------");
  console.log(`Overall Health Score .... ${overallScore}%`);
  console.log("==================================================");

  mongoose.connection.close();
  process.exit(overallScore === 100 ? 0 : 1);
}

verifyAll().catch((err) => {
  console.error("E2E tests failed with exception:", err);
  mongoose.connection.close();
  process.exit(1);
});
