const express = require("express");
const { protect, onlyRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const ctrl = require("../controllers/gigController");

const router = express.Router();

// Public-ish (still requires auth token)
router.get("/", protect, ctrl.getGigs);
router.get("/featured", protect, ctrl.getFeaturedGigs);
router.get("/bookmarks/mine", protect, ctrl.getMyBookmarks);
router.get("/freelancer/:freelancerId", protect, ctrl.getGigsByFreelancer);
router.get("/:id", protect, ctrl.getGigById);

// Freelancer only
router.post("/", protect, onlyRole("freelancer"), upload.array("gallery", 4), ctrl.createGig);
router.put("/:id", protect, onlyRole("freelancer"), upload.array("gallery", 4), ctrl.updateGig);
router.delete("/:id", protect, onlyRole("freelancer"), ctrl.deleteGig);

// Any authenticated user
router.post("/:id/bookmark", protect, ctrl.toggleBookmark);

module.exports = router;
