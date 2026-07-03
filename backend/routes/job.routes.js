const express = require("express");
const router = express.Router();
const jobController = require("../controllers/job.controller");
const { protect } = require("../middleware/auth");

// Guard all job routes
router.use(protect);

router.get("/", jobController.searchJobs);
router.post("/seed", jobController.seedJobs);
router.get("/:jobId", jobController.getJobDetails);

module.exports = router;
