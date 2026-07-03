const multer = require("multer");
const Resume = require("../models/Resume");
const Profile = require("../models/Profile");
const storageService = require("../services/storage.service");
const parserService = require("../services/parser.service");
const aiService = require("../services/ai.service");
const auditService = require("../services/audit.service");
const { sendSuccess, sendError } = require("../utils/response");
const logger = require("../config/logger");

// Configure Multer memory storage for uploads
const uploadConfig = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB file size
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Only PDF, DOC, and DOCX are allowed."), false);
    }
  },
});

class ResumeController {
  constructor() {
    this.upload = uploadConfig.single("resume");
  }

  /**
   * Upload and AI-parse a resume (Steps 2, 3 & 4)
   */
  async uploadResume(req, res, next) {
    try {
      const userId = req.user.userId;
      if (!req.file) {
        return sendError(res, "Please provide a resume file to upload.", 400);
      }

      logger.info(`Resume Controller: Upload started for user ${userId}, file: ${req.file.originalname}`);

      // 1. Stage 1 Text Extraction
      const rawText = await parserService.extractText(req.file.buffer, req.file.mimetype);

      // 2. Stage 2 Structured AI Parsing
      const parsedData = await aiService.parseResume(rawText);

      // 3. Upload file to Storage (Local or Cloudinary)
      const uploadResult = await storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      // 4. Determine default target role for ATS score
      let targetRole = "Software Engineer";
      const profile = await Profile.findOne({ userId });
      if (profile && profile.preferredRole) {
        targetRole = profile.preferredRole;
      }

      // 5. Initial ATS Scoring
      const atsAnalysis = await aiService.analyzeATS(parsedData, targetRole);

      // 6. Calculate next version number
      const highestVersionResume = await Resume.findOne({ userId }).sort({ version: -1 });
      const nextVersion = highestVersionResume ? highestVersionResume.version + 1 : 1;

      // 7. Deactivate old resumes
      await Resume.updateMany({ userId }, { $set: { isActive: false } });

      // 8. Save resume
      const resume = await Resume.create({
        userId,
        fileName: req.file.originalname,
        fileUrl: uploadResult.url,
        cloudinaryPublicId: uploadResult.publicId,
        version: nextVersion,
        isActive: true,
        parsedData,
        atsAnalysis,
      });

      // Update onboarding profile skills list if empty
      if (profile && (!profile.skills || profile.skills.length === 0) && parsedData.skills.length > 0) {
        profile.skills = parsedData.skills.slice(0, 15); // seed profile skills
        await profile.save();
      }

      await auditService.logEvent({
        userId,
        event: "resume_uploaded",
        status: "success",
        ipAddress: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
        details: { filename: req.file.originalname, version: nextVersion, score: atsAnalysis.atsScore },
      });

      return sendSuccess(res, "Resume uploaded, parsed, and scored successfully.", { resume }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get Resume History (Step 2)
   */
  async getResumes(req, res, next) {
    try {
      const userId = req.user.userId;
      const resumes = await Resume.find({ userId }).sort({ version: -1 });
      return sendSuccess(res, "Resumes retrieved successfully.", { resumes });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete specific Resume version
   */
  async deleteResume(req, res, next) {
    try {
      const userId = req.user.userId;
      const { resumeId } = req.params;

      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        return sendError(res, "Resume not found.", 404);
      }

      // Delete file from Storage
      if (resume.cloudinaryPublicId) {
        await storageService.deleteFile(resume.cloudinaryPublicId);
      }

      const wasActive = resume.isActive;
      await Resume.deleteOne({ _id: resumeId });

      logger.info(`Resume Controller: Deleted resume version ${resume.version} for user ${userId}`);

      // If we deleted the active resume, make the next highest version active
      if (wasActive) {
        const highestRemaining = await Resume.findOne({ userId }).sort({ version: -1 });
        if (highestRemaining) {
          highestRemaining.isActive = true;
          await highestRemaining.save();
          logger.info(`Resume Controller: Promoted version ${highestRemaining.version} to active resume.`);
        }
      }

      return sendSuccess(res, "Resume deleted successfully.");
    } catch (error) {
      next(error);
    }
  }

  /**
   * Make specific Resume active
   */
  async setActiveResume(req, res, next) {
    try {
      const userId = req.user.userId;
      const { resumeId } = req.params;

      const targetResume = await Resume.findOne({ _id: resumeId, userId });
      if (!targetResume) {
        return sendError(res, "Resume not found.", 404);
      }

      // Deactivate all
      await Resume.updateMany({ userId }, { $set: { isActive: false } });

      // Activate target
      targetResume.isActive = true;
      await targetResume.save();

      return sendSuccess(res, "Active resume updated successfully.", { resume: targetResume });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Re-run ATS Scoring for custom Target Role
   */
  async analyzeATSForRole(req, res, next) {
    try {
      const userId = req.user.userId;
      const { resumeId } = req.params;
      const { targetRole } = req.body;

      if (!targetRole) {
        return sendError(res, "Target role parameter is required.", 400);
      }

      const resume = await Resume.findOne({ _id: resumeId, userId });
      if (!resume) {
        return sendError(res, "Resume not found.", 404);
      }

      logger.info(`Resume Controller: Custom ATS scan requested for role: ${targetRole}`);

      const newAnalysis = await aiService.analyzeATS(resume.parsedData, targetRole);

      // Update document
      resume.atsAnalysis = newAnalysis;
      await resume.save();

      return sendSuccess(res, `ATS analysis updated for role: ${targetRole}`, { resume });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ResumeController();
