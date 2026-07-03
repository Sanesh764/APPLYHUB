require("dotenv").config();
const storageService = require("../services/storage.service");

async function checkCloudinary() {
  console.log("=== CLOUDINARY CONFIGURATION DIAGNOSTICS ===");

  // 1. Log whether each required variable exists (without printing secrets)
  const cloudNameExists = !!process.env.CLOUDINARY_CLOUD_NAME;
  const apiKeyExists = !!process.env.CLOUDINARY_API_KEY;
  const apiSecretExists = !!process.env.CLOUDINARY_API_SECRET;

  console.log(`Cloud Name: ${cloudNameExists ? "✅ Found" : "❌ Missing"}`);
  console.log(`API Key: ${apiKeyExists ? "✅ Found" : "❌ Missing"}`);
  console.log(`API Secret: ${apiSecretExists ? "✅ Found" : "❌ Missing"}`);

  // 2. Storage Service Selection Verification
  console.log("\nStorage Adapter selected in StorageService:");
  console.log(`  Adapter type: ${storageService.adapter.constructor.name}`);

  if (storageService.adapter.constructor.name !== "CloudinaryStorageAdapter") {
    throw new Error("FAIL: StorageService failed to initialize with CloudinaryStorageAdapter despite credentials existence.");
  }
  console.log("✅ Storage Service properly recognized Cloudinary credentials.");

  // 3. Perform Test Upload
  console.log("\nInitiating test file upload to Cloudinary...");
  const sampleBuffer = Buffer.from("ApplyHub Cloudinary Integration Verification File.");
  const sampleName = `test_verification_${Date.now()}.txt`;
  const sampleMime = "text/plain";

  try {
    const uploadResult = await storageService.uploadFile(sampleBuffer, sampleName, sampleMime);
    
    console.log("\n✅ UPLOAD SUCCESSFUL!");
    console.log(`  Uploaded File URL: ${uploadResult.url}`);
    console.log(`  Public ID: ${uploadResult.publicId}`);

    // Cleanup: try to delete the test file
    console.log("\nAttempting to clean up (delete) test file...");
    const deleted = await storageService.deleteFile(uploadResult.publicId);
    console.log(`  Deletion status: ${deleted ? "Success" : "Failed"}`);
    
  } catch (error) {
    console.error("\n❌ UPLOAD FAILED!");
    console.error(`  Reason: ${error.message}`);
    throw error;
  }
}

checkCloudinary().catch((err) => {
  console.error("\nDiagnostics terminated with errors.");
  process.exit(1);
});
