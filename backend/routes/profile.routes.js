const express = require("express");
const router = express.Router();
const profileController = require("../controllers/profile.controller");
const { protect } = require("../middleware/auth");
const { validateBody } = require("../middleware/zodValidation");
const { createProfileSchema } = require("../schemas/profile.schema.js");

// Guard all profile routes
router.use(protect);

router.get("/", profileController.getProfile);
router.post("/", validateBody(createProfileSchema), profileController.saveProfile);

module.exports = router;
