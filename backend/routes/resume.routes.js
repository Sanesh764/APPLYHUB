const express = require("express");
const router = express.Router();
const resumeController = require("../controllers/resume.controller");
const { protect } = require("../middleware/auth");

// Guard all resume routes
router.use(protect);

router.post("/", resumeController.upload, resumeController.uploadResume);
router.get("/", resumeController.getResumes);
router.delete("/:resumeId", resumeController.deleteResume);
router.post("/:resumeId/active", resumeController.setActiveResume);
router.post("/:resumeId/analyze", resumeController.analyzeATSForRole);

module.exports = router;
