const express = require("express");
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const { getProfile, updateProfile, endorseUser, uploadAvatar, uploadCover } = require("../controllers/userController");

const router = express.Router();

router.put("/profile/avatar", protect, upload.single("image"), uploadAvatar);
router.put("/profile/cover", protect, upload.single("image"), uploadCover);
router.get("/:userId", getProfile);
router.put("/profile", protect, updateProfile);
router.post("/:userId/endorse", protect, endorseUser);

module.exports = router;
