const Notification = require("../models/Notification");
const User = require("../models/User");
const emailService = require("./email.service");
const logger = require("../config/logger");

class NotificationService {
  /**
   * Create an in-app notification
   */
  async createNotification({ userId, title, message, type = "system" }) {
    try {
      const notification = await Notification.create({
        userId,
        title,
        message,
        type,
      });

      logger.info(`Notification Service: Created notification for user ${userId}: "${title}"`);
      return notification;
    } catch (error) {
      logger.error("Notification Service: Failed to create notification", error);
    }
  }

  /**
   * Notify user of application status updates (Kanban updates)
   */
  async notifyApplicationStatusUpdate(userId, jobTitle, companyName, newStatus) {
    const title = `Application Update: ${companyName}`;
    const message = `Your application for ${jobTitle} at ${companyName} has been moved to: ${newStatus.toUpperCase()}.`;

    // 1. Save in-app notification
    await this.createNotification({
      userId,
      title,
      message,
      type: "application",
    });

    // 2. Send email notification
    try {
      const user = await User.findById(userId);
      if (user && user.email && user.isEmailVerified) {
        const subject = `ApplyHub: Application Status Changed - ${companyName}`;
        const emailText = `Hi ${user.name},\n\nYour application for "${jobTitle}" at "${companyName}" has been updated to: ${newStatus.toUpperCase()}.\n\nLog in to your ApplyHub dashboard to view details.\n\nBest regards,\nApplyHub Team`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2563eb;">Application Status Update</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your application status for the role of <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has changed.</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; font-size: 16px; font-weight: bold; margin: 20px 0; text-align: center; border-left: 4px solid #2563eb;">
              New Status: ${newStatus.toUpperCase()}
            </div>
            <p>Log in to your dashboard to review your pipeline timeline.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #999; text-align: center;">ApplyHub Platform • Automated AI Career Assistant</p>
          </div>
        `;

        await emailService.sendMail({
          to: user.email,
          subject,
          text: emailText,
          html: emailHtml,
        });
      }
    } catch (err) {
      logger.error("Notification Service: Email notification failed", err.message);
    }
  }

  /**
   * Send interview reminders (Step 9)
   */
  async notifyInterviewSchedule(userId, jobTitle, companyName, interviewDetails) {
    const title = `Interview Scheduled: ${companyName}`;
    const message = `You have an interview scheduled for ${jobTitle} at ${companyName} on ${new Date(
      interviewDetails.date
    ).toLocaleDateString()}.`;

    await this.createNotification({
      userId,
      title,
      message,
      type: "interview",
    });

    try {
      const user = await User.findById(userId);
      if (user && user.email) {
        const subject = `Interview Scheduled - ${companyName} - ApplyHub`;
        const emailText = `Hi ${user.name},\n\nYou have an interview scheduled for "${jobTitle}" at "${companyName}"!\n\nDate: ${interviewDetails.date}\nNotes: ${interviewDetails.notes || "None"}\n\nGood luck!`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #8b5cf6;">Interview Scheduled!</h2>
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Congratulations! An interview has been scheduled for your application with <strong>${companyName}</strong>.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr style="background-color: #f3f4f6;"><td style="padding: 10px; font-weight: bold;">Role</td><td style="padding: 10px;">${jobTitle}</td></tr>
              <tr><td style="padding: 10px; font-weight: bold;">Date & Time</td><td style="padding: 10px;">${new Date(interviewDetails.date).toLocaleString()}</td></tr>
              <tr style="background-color: #f3f4f6;"><td style="padding: 10px; font-weight: bold;">Format / Details</td><td style="padding: 10px;">${interviewDetails.notes || "Virtual meeting"}</td></tr>
            </table>
            <p>Be sure to review the job requirements and prepare using our AI Interview Assistant features.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 11px; color: #999; text-align: center;">ApplyHub Platform • Good luck with your interview!</p>
          </div>
        `;

        await emailService.sendMail({ to: user.email, subject, text: emailText, html: emailHtml });
      }
    } catch (err) {
      logger.error("Notification Service: Interview alert failed", err.message);
    }
  }

  /**
   * Send application confirmation digest / packet email (Requirement 8)
   */
  async sendApplicationConfirmationEmail(userId, job, status, resumeVersion, coverLetter) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.email) return;

      const subject = status === "applied" 
        ? `ApplyHub: Application Submitted - ${job.companyName}`
        : `ApplyHub: Application Package Prepared - ${job.companyName}`;

      const statusBadgeColor = status === "applied" ? "#10b981" : "#f59e0b";
      const statusText = status === "applied" ? "SUBMITTED" : "PREPARED (Action Required)";

      const emailText = `Hi ${user.name},\n\nDetails of your application for "${job.title}" at "${job.companyName}":\nStatus: ${statusText}\nResume Used: Version ${resumeVersion}\nApply Link: ${job.applyUrl}\n\nBest regards,\nApplyHub Team`;
      
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2563eb; text-align: center;">Application ${status === "applied" ? "Confirmation" : "Package Prepared"}</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Here are the details for your application at <strong>${job.companyName}</strong>:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0; width: 30%;">Job Title</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">${job.title}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Company</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">${job.companyName}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Date</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">${new Date().toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Resume Used</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;">Version ${resumeVersion}</td>
            </tr>
            <tr style="background-color: #f8fafc;">
              <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Status</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0; color: ${statusBadgeColor}; font-weight: bold;">
                ${statusText}
              </td>
            </tr>
            ${job.applyUrl ? `
            <tr>
              <td style="padding: 12px; font-weight: bold; border: 1px solid #e2e8f0;">Apply Link</td>
              <td style="padding: 12px; border: 1px solid #e2e8f0;"><a href="${job.applyUrl}" target="_blank" style="color: #2563eb; text-decoration: none; font-weight: bold;">Apply Page Link</a></td>
            </tr>
            ` : ""}
          </table>

          ${coverLetter ? `
          <h3 style="color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-top: 25px;">Prepared Cover Letter</h3>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 13px; color: #334155; border: 1px solid #e2e8f0; white-space: pre-wrap; line-height: 1.5;">
            ${coverLetter}
          </div>
          ` : ""}

          ${status !== "applied" ? `
          <div style="margin-top: 20px; background-color: #fef3c7; border-left: 4px solid #d97706; padding: 12px; border-radius: 4px; font-size: 13px; color: #92400e;">
            <strong>Action Required</strong>: This provider does not support direct automated candidate injection. Please click the Apply Link above, upload your resume, and copy/paste the cover letter pre-compiled above to finish.
          </div>
          ` : ""}

          <hr style="border: 0; border-top: 1px solid #eee; margin: 25px 0;" />
          <p style="font-size: 11px; color: #999; text-align: center;">ApplyHub Platform • AI Career Assistant</p>
        </div>
      `;

      await emailService.sendMail({
        to: user.email,
        subject,
        text: emailText,
        html: emailHtml,
      });

      logger.info(`Notification Service: Dispatched application confirmation email to ${user.email}`);
    } catch (err) {
      logger.error("Notification Service: Confirmation email failed", err.message);
    }
  }

  /**
   * Retrieve in-app notifications
   */
  async getNotifications(userId) {
    return Notification.find({ userId }).sort({ createdAt: -1 }).limit(30);
  }

  /**
   * Mark all notifications as read
   */
  async markAsRead(userId) {
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
  }
}

module.exports = new NotificationService();
