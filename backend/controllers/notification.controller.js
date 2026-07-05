const notificationService = require("../services/notification.service");
const { sendSuccess } = require("../utils/response");
const asyncHandler = require("../utils/asyncHandler");

class NotificationController {
  /**
   * Get recent notifications
   */
  getNotifications = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    const notifications = await notificationService.getNotifications(userId);
    return sendSuccess(res, "Notifications retrieved successfully.", { notifications });
  });

  /**
   * Mark all notifications as read
   */
  markAsRead = asyncHandler(async (req, res) => {
    const userId = req.user.userId;
    await notificationService.markAsRead(userId);
    return sendSuccess(res, "Notifications marked as read successfully.");
  });
}

module.exports = new NotificationController();
