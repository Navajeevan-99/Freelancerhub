const DirectMessage = require("../models/DirectMessage");
const User = require("../models/User");

const getConversations = async (req, res) => {
  try {
    const messages = await DirectMessage.find({
      $or: [{ from: req.user._id }, { to: req.user._id }],
    }).sort({ createdAt: -1 });

    const recentPartners = new Map();
    for (const msg of messages) {
      const partnerId = String(msg.from) === String(req.user._id) ? String(msg.to) : String(msg.from);
      if (!recentPartners.has(partnerId)) {
        recentPartners.set(partnerId, msg);
      }
    }

    const partnerIds = Array.from(recentPartners.keys());
    const users = await User.find({ _id: { $in: partnerIds } }).select("name avatar role");
    
    const conversations = users.map(user => {
      return {
        user,
        lastMessage: recentPartners.get(String(user._id)),
      };
    }).sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const ids = [String(req.user._id), userId].sort();
    const conversationId = `${ids[0]}_${ids[1]}`;

    const messages = await DirectMessage.find({ conversationId })
      .populate("from", "name avatar")
      .populate("to", "name avatar")
      .sort({ createdAt: 1 });

    // Mark as read
    await DirectMessage.updateMany(
      { conversationId, to: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { text } = req.body;
    
    if (!text) return res.status(400).json({ message: "Text is required" });

    const ids = [String(req.user._id), userId].sort();
    const conversationId = `${ids[0]}_${ids[1]}`;

    let msg = await DirectMessage.create({
      conversationId,
      from: req.user._id,
      to: userId,
      text,
    });

    msg = await msg.populate("from", "name avatar");

    const io = req.app.get("io");
    const users = req.app.get("users");
    
    if (io && users && users[userId]) {
      io.to(users[userId]).emit("newDirectMessage", msg);
    }

    res.status(201).json(msg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getConversations, getMessages, sendMessage };
