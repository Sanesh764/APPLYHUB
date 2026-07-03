const fs = require("fs").promises;
const path = require("path");
const logger = require("../config/logger");

// ---------------------------------------------------------
// Storage Adapter Interface (Implicit)
// Methods:
// - uploadFile(fileBuffer, originalName, mimeType) => { url, publicId }
// - deleteFile(publicIdOrUrl) => boolean
// ---------------------------------------------------------

/**
 * Local File System Storage Adapter
 */
class LocalStorageAdapter {
  constructor() {
    this.uploadDir = path.join(__dirname, "../public/uploads");
    // Ensure upload directory exists synchronously on initialization
    const fsSync = require("fs");
    if (!fsSync.existsSync(this.uploadDir)) {
      fsSync.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(fileBuffer, originalName, mimeType) {
    try {
      const fileExt = path.extname(originalName);
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExt}`;
      const filePath = path.join(this.uploadDir, uniqueName);

      await fs.writeFile(filePath, fileBuffer);
      
      const serverUrl = process.env.BACKEND_URL || "http://localhost:8080";
      const fileUrl = `${serverUrl}/uploads/${uniqueName}`;

      logger.info(`Storage: Uploaded file locally: ${filePath}`);
      return {
        url: fileUrl,
        publicId: uniqueName, // For local files, the unique filename is the ID
      };
    } catch (error) {
      logger.error("Storage Error: Local upload failed", error);
      throw new Error("Failed to save file locally.");
    }
  }

  async deleteFile(publicId) {
    try {
      const filePath = path.join(this.uploadDir, publicId);
      await fs.unlink(filePath);
      logger.info(`Storage: Deleted local file: ${filePath}`);
      return true;
    } catch (error) {
      logger.error(`Storage Error: Local file deletion failed for ID: ${publicId}`, error);
      return false;
    }
  }
}

/**
 * Cloudinary Storage Adapter
 */
class CloudinaryStorageAdapter {
  constructor() {
    const cloudinary = require("cloudinary").v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    this.cloudinary = cloudinary;
  }

  async uploadFile(fileBuffer, originalName, mimeType) {
    return new Promise((resolve, reject) => {
      // Create readable stream from buffer
      const uploadStream = this.cloudinary.uploader.upload_stream(
        {
          folder: "applyhub_resumes",
          resource_type: "raw", // Needed for PDFs/Word docs
          public_id: path.parse(originalName).name + "-" + Date.now(),
        },
        (error, result) => {
          if (error) {
            logger.error("Storage Error: Cloudinary upload failed", error);
            return reject(new Error("Cloudinary upload failed: " + error.message));
          }
          logger.info(`Storage: Uploaded file to Cloudinary: ${result.secure_url}`);
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
          });
        }
      );

      // Write buffer to upload stream
      uploadStream.end(fileBuffer);
    });
  }

  async deleteFile(publicId) {
    try {
      const result = await this.cloudinary.uploader.destroy(publicId, {
        resource_type: "raw",
      });
      logger.info(`Storage: Deleted Cloudinary file: ${publicId}, result: ${result.result}`);
      return result.result === "ok";
    } catch (error) {
      logger.error(`Storage Error: Cloudinary file deletion failed for: ${publicId}`, error);
      return false;
    }
  }
}

// ---------------------------------------------------------
// Storage Service Manager
// Resolves adapter based on environment configuration
// ---------------------------------------------------------
class StorageService {
  constructor() {
    const isCloudinaryConfigured =
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET;

    if (isCloudinaryConfigured) {
      logger.info("Storage Service: Initialized with Cloudinary Storage Adapter.");
      this.adapter = new CloudinaryStorageAdapter();
    } else {
      logger.info("Storage Service: Credentials missing. Fallback to Local Storage Adapter.");
      this.adapter = new LocalStorageAdapter();
    }
  }

  /**
   * Upload file buffer
   * @param {Buffer} fileBuffer 
   * @param {string} originalName 
   * @param {string} mimeType 
   */
  async uploadFile(fileBuffer, originalName, mimeType) {
    return this.adapter.uploadFile(fileBuffer, originalName, mimeType);
  }

  /**
   * Delete uploaded file
   * @param {string} publicId 
   */
  async deleteFile(publicId) {
    return this.adapter.deleteFile(publicId);
  }
}

module.exports = new StorageService();
