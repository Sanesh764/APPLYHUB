require("dotenv").config();
const nodemailer = require("nodemailer");
const emailService = require("../services/email.service");

async function checkSMTP() {
  console.log("=== SMTP CONFIGURATION DIAGNOSTICS ===");

  // 1. Check if SMTP environment variables are defined (without printing credentials)
  const hostExists = !!process.env.SMTP_HOST;
  const portExists = !!process.env.SMTP_PORT;
  const userExists = !!process.env.SMTP_USER;
  const passExists = !!process.env.SMTP_PASS;
  const fromExists = !!process.env.SMTP_FROM;

  console.log(`SMTP Host: ${hostExists ? "✅ Found" : "❌ Missing"}`);
  console.log(`SMTP Port: ${portExists ? "✅ Found" : "❌ Missing"}`);
  console.log(`SMTP User: ${userExists ? "✅ Found" : "❌ Missing"}`);
  console.log(`SMTP Pass: ${passExists ? "✅ Found" : "❌ Missing"}`);
  console.log(`SMTP From: ${fromExists ? "✅ Found" : "❌ Missing"}`);

  if (!emailService.transporter) {
    throw new Error("FAIL: EmailService was initialized in DEV MODE (mock). No transporter created.");
  }
  console.log("✅ EmailService initialized with an SMTP transporter.");

  // 2. Validate SMTP Transporter connection handshake (verify)
  console.log("\nValidating SMTP Connection Handshake...");
  try {
    await emailService.transporter.verify();
    console.log("✅ SMTP Handshake Successful! Transporter is ready.");
  } catch (error) {
    console.error("❌ SMTP Handshake Failed!");
    console.error(`  Reason: ${error.message}`);
    throw error;
  }

  // 3. Send a test email to the configured user address
  const targetEmail = process.env.SMTP_USER;
  console.log(`\nAttempting to send real test email to: ${targetEmail}`);

  try {
    await emailService.sendMail({
      to: targetEmail,
      subject: "ApplyHub SMTP Test",
      text: "Hello,\n\nThis is a test email from ApplyHub.\n\nIf you received this email, SMTP has been configured successfully.\n\nRegards,\nApplyHub Team",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #2563eb;">ApplyHub SMTP Test</h2>
          <p>Hello,</p>
          <p>This is a test email from ApplyHub.</p>
          <p>If you received this email, SMTP has been configured successfully.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 11px; color: #999;">Regards,<br>ApplyHub Team</p>
        </div>
      `
    });
    console.log("✅ Test email sent successfully!");
  } catch (error) {
    console.error("❌ Failed to send test email!");
    console.error(`  Reason: ${error.message}`);
    throw error;
  }
}

checkSMTP().catch((err) => {
  console.error("\nSMTP diagnostics terminated with errors.");
  process.exit(1);
});
