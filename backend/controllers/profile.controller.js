const Profile = require("../models/Profile");
const User = require("../models/User");
const { sendSuccess, sendError } = require("../utils/response");
const logger = require("../config/logger");

class ProfileController {
  /**
   * Get User Profile (Onboarding settings)
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const profile = await Profile.findOne({ userId });

      if (!profile) {
        return sendSuccess(res, "Profile not found", { profile: null, isCompleted: false });
      }

      return sendSuccess(res, "Profile retrieved successfully", {
        profile,
        isCompleted: profile.isCompleted,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or Update User Profile (Onboarding wizard submission)
   */
  async saveProfile(req, res, next) {
    try {
      const userId = req.user.userId;
      const profileData = req.body;

      // Upsert profile
      const profile = await Profile.findOneAndUpdate(
        { userId },
        {
          ...profileData,
          userId,
          isCompleted: true,
        },
        { new: true, upsert: true, runValidators: true }
      );

      logger.info(`Profile Controller: Onboarding profile saved for user ${userId}`);

      return sendSuccess(res, "Profile onboarding completed successfully", { profile });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProfileController();
