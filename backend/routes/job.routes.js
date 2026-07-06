const express = require("express");
const router = express.Router();
const jobController = require("../controllers/job.controller");
const { protect } = require("../middleware/auth");

// Guard all job routes
router.use(protect);

// Static / specific paths MUST be declared before the dynamic "/:jobId".
router.get("/providers/health", jobController.getProvidersHealth);
router.get("/search", jobController.searchJobs);
router.get("/recommended", jobController.getRecommended);
router.get("/trending", jobController.getTrending);
router.get("/remote", jobController.getRemoteJobs);
router.get("/salary", jobController.getSalaryJobs);
router.get("/company/:company", jobController.getJobsByCompany);

// Cached listing (root) and single job details.
router.get("/", jobController.getJobs);
router.get("/:jobId", jobController.getJobDetails);

module.exports = router;
