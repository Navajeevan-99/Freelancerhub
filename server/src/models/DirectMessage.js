const mongoose = require("mongoose");

const directMessageSchema = new mongoose.Schema(
  {
    conversationId: { type: String, required: true, index: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DirectMessage", directMessageSchema);
