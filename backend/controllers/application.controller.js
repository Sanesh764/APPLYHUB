const Application = require("../models/Application");
const Job = require("../models/Job");
const Resume = require("../models/Resume");
const aiService = require("../services/ai.service");
const notificationService = require("../services/notification.service");
const auditService = require("../services/audit.service");
const { sendSuccess } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");
const { ValidationError, ConflictError, NotFoundError } = require("../utils/errors");
const logger = require("../config/logger");

class ApplicationController {
  /**
   * Get all Applications for current user (Step 7 Pipeline)
   */
  getApplications = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const applications = await Application.find({ userId })
      .populate("jobId")
      .sort({ updatedAt: -1 });

    return sendSuccess(res, "Applications retrieved successfully.", { applications });
  });

  /**
   * Save / Create new application (Step 5 Save / Step 7 Add)
   */
  createApplication = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { jobId, status = "saved", coverLetter } = req.body;

    if (!jobId) {
      throw new ValidationError("Job ID is required.", "jobId");
    }

    // Check for duplicate
    const existingApp = await Application.findOne({ userId, jobId });
    if (existingApp) {
      throw new ConflictError("You have already saved or applied to this job.");
    }

    const job = await Job.findById(jobId);
    if (!job) {
      throw new NotFoundError("Job posting not found.");
    }

    const activeResume = await Resume.findOne({ userId, isActive: true });
    const resumeVersion = activeResume ? activeResume.version : 1;

    // Calculate match score
    let matchScore = 0;
    const matchingService = require("../services/matching.service");
    if (activeResume) {
      try {
        const matchResult = await matchingService.calculateMatch(activeResume.parsedData, job);
        matchScore = matchResult.matchPercentage;
      } catch (err) {
        // Match scoring is best-effort; never block the application on it.
        logger.error(`Application Controller: Match score calculation failed: ${err.message}`);
      }
    }

    let finalCoverLetter = coverLetter || "";

    // Auto-generate cover letter if applying directly and no cover letter provided
    if (status === "applied" && !finalCoverLetter) {
      if (activeResume) {
        finalCoverLetter = await aiService.generateCoverLetter(
          activeResume.parsedData,
          job.companyName,
          job.title,
          job.description
        );
      }
    }

    const app = await Application.create({
      userId,
      jobId,
      status,
      coverLetter: finalCoverLetter,
      resumeVersion, // Requirement 9: Store resume version
      matchScore, // Requirement 9: Store match score
      appliedAt: status === "applied" ? new Date() : null,
      history: [
        {
          status,
          notes: `Application initialized in pipeline as ${status.toUpperCase()}.`,
        },
      ],
    });

    // Dispatch confirmation email (Requirement 8)
    notificationService.sendApplicationConfirmationEmail(
      userId,
      job,
      status,
      resumeVersion,
      finalCoverLetter
    );

    await auditService.logEvent({
      userId,
      event: `application_${status}`,
      status: "success",
      ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      userAgent: req.headers["user-agent"],
      details: { jobId, company: job.companyName, role: job.title },
    });

    return sendSuccess(res, "Application recorded successfully.", { application: app }, 201);
  });

  /**
   * Update application status (Kanban drag-drop - Step 7)
   */
  updateApplicationStatus = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { applicationId } = req.params;
    const { status, notes } = req.body;

    const allowedStatuses = ["saved", "applied", "pending", "interview", "rejected", "offer"];
    if (!status || !allowedStatuses.includes(status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${allowedStatuses.join(", ")}.`, "status");
    }

    const app = await Application.findOne({ _id: applicationId, userId }).populate("jobId");
    if (!app) {
      throw new NotFoundError("Application not found.");
    }

    const oldStatus = app.status;
    app.status = status;

    // Update history
    app.history.push({
      status,
      notes: notes || `Moved application state from ${oldStatus.toUpperCase()} to ${status.toUpperCase()}.`,
      updatedAt: new Date(),
    });

    // Set timestamp if applied
    if (status === "applied" && !app.appliedAt) {
      app.appliedAt = new Date();
    }

    await app.save();

    logger.info(`Application Controller: User ${userId} updated app ${applicationId} status to ${status}`);

    // Dispatch alert notifications and emails
    await notificationService.notifyApplicationStatusUpdate(
      userId,
      app.jobId.title,
      app.jobId.companyName,
      status
    );

    return sendSuccess(res, "Application status updated successfully.", { application: app });
  });

  /**
   * Generate customized AI Cover Letter (Step 6)
   */
  generateCoverLetter = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const { jobId } = req.body;

    if (!jobId) {
      throw new ValidationError("Job ID is required.", "jobId");
    }

    const activeResume = await Resume.findOne({ userId, isActive: true });
    if (!activeResume) {
      throw new ValidationError("Please upload a resume first to generate cover letters.");
    }

    const job = await Job.findById(jobId);
    if (!job) {
      throw new NotFoundError("Job posting not found.");
    }

    const coverLetter = await aiService.generateCoverLetter(
      activeResume.parsedData,
      job.companyName,
      job.title,
      job.description
    );

    return sendSuccess(res, "Cover letter generated successfully.", { coverLetter });
  });

  /**
   * Advanced Dashboard Analytics data (Step 7 & 10)
   */
  getAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user.userId;

    // 1. Fetch total counts per status
    const pipelineStats = await Application.aggregate([
      { $match: { userId } },
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const counts = {
      saved: 0,
      applied: 0,
      pending: 0,
      interview: 0,
      rejected: 0,
      offer: 0,
    };

    pipelineStats.forEach((stat) => {
      if (counts[stat._id] !== undefined) {
        counts[stat._id] = stat.count;
      }
    });

    const totalApplications = Object.values(counts).reduce((a, b) => a + b, 0);

    // 2. Fetch Active Resume ATS details
    const activeResume = await Resume.findOne({ userId, isActive: true });
    const atsScore = activeResume ? activeResume.atsAnalysis.atsScore : 0;

    // 3. Calculate response rate (interviews / applied+pending+rejected+interview+offer)
    const nonSavedCount = totalApplications - counts.saved;
    const responseRate = nonSavedCount > 0
      ? Math.round(((counts.interview + counts.offer) / nonSavedCount) * 100)
      : 0;

    // 4. Generate weekly timeline data (mocked/grouped by date for the dashboard chart)
    // Grouping last 7 days of activities
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const weeklyTimeline = await Application.aggregate([
      { $match: { userId, updatedAt: { $gte: lastWeek } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const formattedWeeklyTimeline = weeklyTimeline.map((item) => ({
      day: new Date(item._id).toLocaleDateString("en-US", { weekday: "short" }),
      applications: item.count,
    }));

    // Fallback/seed values for weekly timeline if empty
    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const seedWeekly = weekdays.map((day) => {
      const match = formattedWeeklyTimeline.find((w) => w.day === day);
      return {
        day,
        applications: match ? match.applications : 0,
      };
    });

    return sendSuccess(res, "Analytics compiled successfully.", {
      totalApplications,
      responseRate,
      atsScore,
      counts,
      weeklyTimeline: seedWeekly,
    });
  });
}

module.exports = new ApplicationController();
