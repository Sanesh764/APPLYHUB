const Profile = require("../models/Profile");
const { sendSuccess } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");
const logger = require("../config/logger");

class ProfileController {
  /**
   * Get User Profile (Onboarding settings)
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const profile = await Profile.findOne({ userId });

    // A missing profile is a valid onboarding state (not a 404); the frontend
    // relies on this 200 + { profile: null } to route new users to onboarding.
    if (!profile) {
      return sendSuccess(res, "Profile not found", { profile: null, isCompleted: false });
    }

    return sendSuccess(res, "Profile retrieved successfully", {
      profile,
      isCompleted: profile.isCompleted,
    });
  });

  /**
   * Create or Update User Profile (Onboarding wizard submission)
   */
  saveProfile = asyncHandler(async (req, res) => {
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
  });
}

module.exports = new ProfileController();
