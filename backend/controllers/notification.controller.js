const notificationService = require("../services/notification.service");
const { sendSuccess } = require("../utils/response");

class NotificationController {
  /**
   * Get recent notifications
   */
  async getNotifications(req, res, next) {
    try {
      const userId = req.user.userId;
      const notifications = await notificationService.getNotifications(userId);
      return sendSuccess(res, "Notifications retrieved successfully.", { notifications });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAsRead(req, res, next) {
    try {
      const userId = req.user.userId;
      await notificationService.markAsRead(userId);
      return sendSuccess(res, "Notifications marked as read successfully.");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
