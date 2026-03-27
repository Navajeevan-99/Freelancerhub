const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema(
  {
    job: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: false },
    gigOrder: { type: mongoose.Schema.Types.ObjectId, ref: "GigOrder" },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "" },
    scope: { type: String, default: "" },
    budget: { type: Number },
    deadline: { type: Date },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    status: {
      type: String,
      enum: ["active", "review", "completed"],
      default: "active",
    },
    paymentStatus: { type: String, enum: ["pending", "paid"], default: "pending" },
    tasks: [
      {
        title: String,
        status: { type: String, enum: ["todo", "in_progress", "done"], default: "todo" },
        assignedTo: { type: String, enum: ["client", "freelancer"], default: "freelancer" },
      }
    ],
    files: [
      {
        name: String,
        url: String,
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      }
    ],
    milestones: [
      {
        title: String,
        isCompleted: { type: Boolean, default: false },
        amount: Number
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
