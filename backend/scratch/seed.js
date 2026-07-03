require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const User = require("../models/User");
const Session = require("../models/Session");
const OTP = require("../models/OTP");
const AuditLog = require("../models/AuditLog");

async function seedDatabase() {
  console.log("Connecting to database for seeding...");
  await connectDB();

  console.log("Cleaning up collections...");
  await User.deleteMany({ email: { $in: ["admin@applyhub.com", "user@applyhub.com"] } });
  
  console.log("Creating verified admin account...");
  await User.create({
    name: "System Administrator",
    email: "admin@applyhub.com",
    password: "Password123!",
    role: "admin",
    isEmailVerified: true,
    isPhoneVerified: true,
  });
  console.log("Admin account seeded successfully: admin@applyhub.com / Password123!");

  console.log("Creating verified user account...");
  await User.create({
    name: "John Application",
    email: "user@applyhub.com",
    password: "Password123!",
    role: "user",
    isEmailVerified: true,
    isPhoneVerified: true,
  });
  console.log("User account seeded successfully: user@applyhub.com / Password123!");

  console.log("Database seeded successfully!");
  mongoose.connection.close();
}

seedDatabase().catch((err) => {
  console.error("Seeding failed:", err);
  mongoose.connection.close();
});
