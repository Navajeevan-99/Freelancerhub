const express = require("express");
const { protect } = require("../middleware/auth");
const { getConversations, getMessages, sendMessage } = require("../controllers/directMessageController");

const router = express.Router();

router.get("/conversations", protect, getConversations);
router.get("/:userId", protect, getMessages);
router.post("/:userId", protect, sendMessage);

module.exports = router;
