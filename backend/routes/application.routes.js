const express = require("express");
const router = express.Router();
const applicationController = require("../controllers/application.controller");
const { protect } = require("../middleware/auth");

// Guard all application routes
router.use(protect);

router.get("/", applicationController.getApplications);
router.post("/", applicationController.createApplication);
router.put("/:applicationId/status", applicationController.updateApplicationStatus);
router.post("/cover-letter", applicationController.generateCoverLetter);
router.get("/analytics", applicationController.getAnalytics);

module.exports = router;
