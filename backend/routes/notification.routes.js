const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notification.controller");
const { protect } = require("../middleware/auth");

// Guard all routes
router.use(protect);

router.get("/", notificationController.getNotifications);
router.post("/read", notificationController.markAsRead);

module.exports = router;
