const express = require("express");
const { protect } = require("../middleware/auth");
const ctrl = require("../controllers/connectionController");

const router = express.Router();

router.post("/request", protect, ctrl.requestConnection);
router.put("/:connectionId/accept", protect, ctrl.acceptConnection);
router.get("/mine", protect, ctrl.getConnections);
router.get("/discover", protect, ctrl.getDiscoverConnections);

module.exports = router;
