const nodemailer = require("nodemailer");
const logger = require("../config/logger");

class EmailService {
  constructor() {
    this.transporter = null;
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    this.fromEmail = process.env.SMTP_FROM || "noreply@applyhub.com";

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
      logger.info("Email Service: SMTP Transporter initialized successfully.");
    } else {
      logger.info(
        "Email Service: SMTP credentials missing. Running in DEV MODE (Emails will print to console)."
      );
    }
  }

  /**
   * General send email helper
   */
  async sendMail({ to, subject, html, text }) {
    if (this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: `"ApplyHub Support" <${this.fromEmail}>`,
          to,
          subject,
          text,
          html,
        });
        logger.info(`Email Service: Email sent to ${to}. Message ID: ${info.messageId}`);
        return true;
      } catch (error) {
        logger.error(`Email Service: Failed to send email to ${to}: ${error.message}`, { error });
        throw new Error("Failed to send transactional email.");
      }
    } else {
      // DEV MODE
      logger.warn(`
==================================================
[Email Service] [DEV MODE]
To: ${to}
Subject: ${subject}
Text: ${text}
--------------------------------------------------
HTML Content:
${html}
==================================================
      `);
      return true;
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email, name, verificationLink) {
    const subject = "Verify your email address - ApplyHub";
    const text = `Hi ${name},\n\nPlease verify your email by clicking the link: ${verificationLink}\n\nThis link will expire in 24 hours.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2563eb; text-align: center;">Welcome to ApplyHub!</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>Thank you for signing up. Please verify your email address to unlock your account and get started with automated job applications.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Verify Email Address</a>
        </div>
        <p style="font-size: 12px; color: #666;">Or copy and paste this link in your browser:</p>
        <p style="font-size: 12px; word-break: break-all; color: #2563eb;">${verificationLink}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">This link will expire in 24 hours. If you did not sign up for ApplyHub, you can safely ignore this email.</p>
      </div>
    `;
    return this.sendMail({ to: email, subject, text, html });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, name, resetLink) {
    const subject = "Reset your password - ApplyHub";
    const text = `Hi ${name},\n\nYou requested to reset your password. Please use the following link: ${resetLink}\n\nThis link will expire in 15 minutes.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #ef4444; text-align: center;">Reset Your Password</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>You recently requested to reset the password for your ApplyHub account. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; display: inline-block;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #666;">Or copy and paste this link in your browser:</p>
        <p style="font-size: 12px; word-break: break-all; color: #ef4444;">${resetLink}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #999; text-align: center;">This link will expire in 15 minutes. If you did not request this, please change your password immediately or contact support.</p>
      </div>
    `;
    return this.sendMail({ to: email, subject, text, html });
  }

  /**
   * Send login security alert email (optional helper)
   */
  async sendSecurityAlertEmail(email, name, details) {
    const subject = "Security Alert: New login from a new device - ApplyHub";
    const text = `Hi ${name},\n\nWe detected a login from a new device/browser:\nIP: ${details.ipAddress}\nDevice: ${details.device}\nTime: ${new Date().toLocaleString()}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #f59e0b; text-align: center;">New Device Sign-In</h2>
        <p>Hi <strong>${name}</strong>,</p>
        <p>We detected a new sign-in to your ApplyHub account. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #f3f4f6;"><td style="padding: 10px; font-weight: bold;">Device / Browser</td><td style="padding: 10px;">${details.device}</td></tr>
          <tr><td style="padding: 10px; font-weight: bold;">IP Address</td><td style="padding: 10px;">${details.ipAddress}</td></tr>
          <tr style="background-color: #f3f4f6;"><td style="padding: 10px; font-weight: bold;">Date & Time</td><td style="padding: 10px;">${new Date().toLocaleString()}</td></tr>
        </table>
        <p>If this was you, you can safely ignore this warning. If this wasn't you, please change your password immediately and revoke other devices from your user profile profile settings.</p>
      </div>
    `;
    return this.sendMail({ to: email, subject, text, html });
  }
}

module.exports = new EmailService();
