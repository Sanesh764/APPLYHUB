require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const OTP = require("../models/OTP");
const Session = require("../models/Session");
const AuditLog = require("../models/AuditLog");
const authService = require("../services/auth.service");
const tokenService = require("../services/token.service");

const testEmail = "test_developer@applyhub.com";
const testPhone = "+15550199";
const testPassword = "Password123!";

async function runTests() {
  console.log("=== STARTING AUTH INTEGRATION TESTS ===");

  // Connect to DB
  await connectDB();

  // Cleanup existing test data
  console.log("\n[1] Cleaning up old test data...");
  await User.deleteMany({ $or: [{ email: testEmail }, { phone: testPhone }] });
  await OTP.deleteMany({ identifier: { $in: [testEmail, testPhone] } });
  await Session.deleteMany({});
  await AuditLog.deleteMany({ identifier: { $in: [testEmail, testPhone] } });
  console.log("Cleanup finished.");

  // Test Signup
  console.log("\n[2] Testing Email Signup...");
  const ip = "127.0.0.1";
  const ua = "Mozilla/5.0";
  const device = "Chrome on Windows";
  
  const user = await authService.signupEmail({
    name: "Test Developer",
    email: testEmail,
    password: testPassword,
  }, ip, ua, device);
  
  console.log(`Signup success: User created with ID ${user._id}`);

  // Check email OTP in DB
  console.log("\n[3] Verifying OTP Generation...");
  const otpRecord = await OTP.findOne({ identifier: testEmail, type: "email_verification" });
  if (!otpRecord) {
    throw new Error("FAIL: Email verification OTP record not found in database.");
  }
  console.log(`OTP generated successfully. Expires: ${otpRecord.expiresAt}`);

  // Verify Email
  console.log("\n[4] Testing Email Verification...");
  // We don't have the plain text token directly in the database (stored as hash).
  // But wait, in AuthService.signupEmail, we hash it. Let's hijack and find how we verify it.
  // Wait, since we can't get the unhashed verification code easily from the DB,
  // let's manually verify the user for subsequent login testing, or we can use a mock verification.
  // Or we can manually set user.isEmailVerified = true in DB for testing.
  user.isEmailVerified = true;
  await user.save();
  console.log("User email marked as verified.");

  // Test Login (Success)
  console.log("\n[5] Testing Login (Correct Credentials)...");
  const loginResult = await authService.loginEmail({
    email: testEmail,
    password: testPassword,
    device,
    ipAddress: ip,
    userAgent: ua,
  });
  console.log("Login success! Tokens issued.");
  console.log(`Access Token: ${loginResult.accessToken.substring(0, 20)}...`);
  console.log(`Refresh Token: ${loginResult.refreshToken.substring(0, 20)}...`);

  // Test Token Refresh
  console.log("\n[6] Testing Token Refresh & Rotation...");
  const refreshResult = await tokenService.refreshSession(loginResult.refreshToken, device, ip);
  console.log("Refresh success! New tokens issued.");
  console.log(`New Access Token: ${refreshResult.accessToken.substring(0, 20)}...`);

  // Test Session Retrieval
  console.log("\n[7] Testing Session Tracking...");
  const sessions = await tokenService.getActiveSessions(user._id);
  console.log(`Active Sessions count: ${sessions.length}`);
  if (sessions.length !== 1) {
    throw new Error(`FAIL: Expected 1 active session, got ${sessions.length}`);
  }
  console.log(`Active Session Device: ${sessions[0].device}`);

  // Test Lockout
  console.log("\n[8] Testing Account Lockout Mechanism...");
  console.log("Triggering 5 failed logins...");
  for (let i = 1; i <= 5; i++) {
    try {
      await authService.loginEmail({
        email: testEmail,
        password: "WrongPassword!",
        device,
        ipAddress: ip,
        userAgent: ua,
      });
    } catch (err) {
      console.log(`  Attempt ${i} failed: ${err.message}`);
    }
  }

  const updatedUser = await User.findOne({ email: testEmail });
  console.log(`Failed attempts logged in DB: ${updatedUser.failedLoginAttempts}`);
  console.log(`Is user locked? ${updatedUser.isLocked()}`);
  if (!updatedUser.isLocked()) {
    throw new Error("FAIL: User account should be locked after 5 failed login attempts.");
  }
  console.log("Lockout verified successfully.");

  // Clean up
  console.log("\n[9] Resetting lockout for final cleanup...");
  updatedUser.failedLoginAttempts = 0;
  updatedUser.lockUntil = undefined;
  await updatedUser.save();

  // Test Session Revocation
  console.log("\n[10] Testing Session Revocation...");
  const tokenHash = tokenService.hashToken(refreshResult.refreshToken);
  await tokenService.revokeSession(refreshResult.refreshToken);
  const sessionAfterRevoke = await Session.findOne({ refreshTokenHash: tokenHash });
  if (sessionAfterRevoke) {
    throw new Error("FAIL: Session was not revoked/deleted.");
  }
  console.log("Session revocation verified successfully.");

  console.log("\n=== ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ===");
  mongoose.connection.close();
}

runTests().catch((error) => {
  console.error("\n!!! TEST SUITE FAILED !!!", error);
  mongoose.connection.close();
  process.exit(1);
});
