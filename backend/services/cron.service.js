const cron = require("node-cron");
const Profile = require("../models/Profile");
const Resume = require("../models/Resume");
const Job = require("../models/Job");
const Application = require("../models/Application");
const User = require("../models/User");
const jobProviderService = require("./jobProvider.service");
const matchingService = require("./matching.service");
const aiService = require("./ai.service");
const notificationService = require("./notification.service");
const emailService = require("./email.service");
const logger = require("../config/logger");

class CronService {
  constructor() {
    this.jobs = {};
  }

  /**
   * Initialize and start scheduled cron tasks
   */
  init() {
    logger.info("Cron Service: Initializing background cron jobs...");

    // Schedule automated job discovery every 6 hours
    // For safety, we store the task reference so it can be managed
    this.jobs.dailyAutomation = cron.schedule("0 */6 * * *", async () => {
      logger.info("Cron Service: Executing scheduled 6-hour job automation...");
      try {
        await this.runDailyAutomation();
      } catch (err) {
        logger.error("Cron Service: Scheduled automation task failed", err);
      }
    });

    logger.info("Cron Service: 6-hour job discovery cron scheduled successfully.");
  }

  /**
   * Run automated discovery and submission pipeline
   * Can also be triggered manually via endpoints for verification.
   */
  async runDailyAutomation() {
    logger.info("Cron Service: Starting job discovery pipeline...");

    // Find all users who completed onboarding and enabled automation
    const activeProfiles = await Profile.find({ isCompleted: true, isAutomationEnabled: true });
    logger.info(`Cron Service: Found ${activeProfiles.length} active users with automation enabled.`);

    const summaryReport = [];

    for (const profile of activeProfiles) {
      try {
        // Find active resume version
        const resume = await Resume.findOne({ userId: profile.userId, isActive: true });
        if (!resume) {
          logger.warn(`Cron Service: User ${profile.userId} has automation enabled but no active resume.`);
          continue;
        }

        const user = await User.findById(profile.userId);
        if (!user) continue;

        // Perform job search based on user profile preferences
        const jobs = await jobProviderService.searchJobs({
          query: profile.preferredRole,
          workMode: profile.workMode,
          salary: profile.expectedSalary,
          location: profile.preferredCities[0] || "",
        });

        if (jobs.length === 0) continue;

        const autoApplied = [];
        const preparedManual = [];

        for (const job of jobs) {
          // Check if application exists
          const existingApp = await Application.findOne({ userId: profile.userId, jobId: job.id });
          if (existingApp) continue;

          // Run hybrid match
          const matchResult = await matchingService.calculateMatch(resume.parsedData, job);

          // Threshold for automation: 80%
          if (matchResult.matchPercentage >= 80) {
            // Generate customized cover letter
            const coverLetter = await aiService.generateCoverLetter(
              resume.parsedData,
              job.companyName,
              job.title,
              job.description
            );

            // Determine if auto-apply is officially supported (local seed jobs act as easy apply)
            if (job.isAutoSupported) {
              // Create auto-submitted application
              await Application.create({
                userId: profile.userId,
                jobId: job.id,
                status: "applied",
                coverLetter,
                resumeVersion: resume.version || 1,
                matchScore: matchResult.matchPercentage,
                appliedAt: new Date(),
                history: [
                  {
                    status: "applied",
                    notes: "Application automatically prepared and submitted by ApplyHub AI.",
                  },
                ],
              });

              await notificationService.createNotification({
                userId: profile.userId,
                title: `Auto-Applied: ${job.companyName}`,
                message: `We matched your resume (${matchResult.matchPercentage}%) and automatically applied for the ${job.title} position.`,
                type: "application",
              });

              autoApplied.push({ title: job.title, company: job.companyName, score: matchResult.matchPercentage });
            } else {
              // Create saved/prepared application
              await Application.create({
                userId: profile.userId,
                jobId: job.id,
                status: "saved",
                coverLetter,
                resumeVersion: resume.version || 1,
                matchScore: matchResult.matchPercentage,
                history: [
                  {
                    status: "saved",
                    notes: "Application package (Resume + Cover Letter) prepared by ApplyHub. Action required to complete submission.",
                  },
                ],
              });

              await notificationService.createNotification({
                userId: profile.userId,
                title: `Application Prepared: ${job.companyName}`,
                message: `Excellent match (${matchResult.matchPercentage}%)! We pre-generated your cover letter for ${job.title}. Click to review and submit manually.`,
                type: "application",
              });

              preparedManual.push({ title: job.title, company: job.companyName, score: matchResult.matchPercentage });
            }
          }
        }

        // Send digest email if matches were found for the user
        if (autoApplied.length > 0 || preparedManual.length > 0) {
          await this.sendDailyDigestEmail(user, autoApplied, preparedManual);
          summaryReport.push({
            userId: user._id,
            email: user.email,
            applied: autoApplied.length,
            prepared: preparedManual.length,
          });
        }
      } catch (err) {
        logger.error(`Cron Service: Failed to process pipeline for profile: ${profile._id}`, err);
      }
    }

    logger.info(`Cron Service: Finished job discovery pipeline. Processed summaries for ${summaryReport.length} users.`);
    return summaryReport;
  }

  /**
   * Send daily email digest containing matches
   */
  async sendDailyDigestEmail(user, autoApplied, preparedManual) {
    const subject = "ApplyHub: Your Daily AI Job Search Digest";
    
    let appliedRows = autoApplied.map(
      (job) => `<li><strong>${job.title}</strong> at <em>${job.company}</em> (${job.score}% Match) - <span style="color:#10b981;font-weight:bold;">SUBMITTED</span></li>`
    ).join("");

    let preparedRows = preparedManual.map(
      (job) => `<li><strong>${job.title}</strong> at <em>${job.company}</em> (${job.score}% Match) - <span style="color:#3b82f6;font-weight:bold;">PREPARED (Action Required)</span></li>`
    ).join("");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">Daily AI Job Digest</h2>
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Our background AI matching engine has completed its daily scan of new opportunities matching your profile settings.</p>
        
        ${
          autoApplied.length > 0
            ? `
          <h3 style="color:#10b981; border-bottom:1px solid #eee; padding-bottom:5px;">Automatically Submitted Applications</h3>
          <ul>${appliedRows}</ul>
        `
            : ""
        }

        ${
          preparedManual.length > 0
            ? `
          <h3 style="color:#3b82f6; border-bottom:1px solid #eee; padding-bottom:5px;">Prepared Application Packages</h3>
          <p style="font-size:12px;color:#666;">These opportunities do not support direct integration. We have pre-compiled your custom cover letter and matching stats. Log in to submit them manually:</p>
          <ul>${preparedRows}</ul>
        `
            : ""
        }

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 11px; color: #999; text-align: center;">You received this email because you opted into automated job discovery. You can change your preferences in profile settings at any time.</p>
      </div>
    `;

    await emailService.sendMail({
      to: user.email,
      subject,
      text: `Hi ${user.name},\n\nWe found new matching jobs for you today. Log in to your ApplyHub dashboard to view details.`,
      html: emailHtml,
    });
  }
}

module.exports = new CronService();
