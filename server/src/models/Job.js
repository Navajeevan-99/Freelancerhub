const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    skills: [{ type: String }],
    budgetMin: { type: Number, required: true },
    budgetMax: { type: Number, required: true },
    deadline: { type: Date, required: true },
    status: { type: String, enum: ["active", "in_progress", "completed"], default: "active" },
    invitedFreelancers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
