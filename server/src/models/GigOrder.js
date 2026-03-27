const mongoose = require("mongoose");

const gigOrderSchema = new mongoose.Schema(
  {
    gig: { type: mongoose.Schema.Types.ObjectId, ref: "Gig", required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    selectedPackage: {
      type: String,
      enum: ["basic", "standard", "premium"],
      required: true,
    },
    // Snapshot of selected package at order time
    packageSnapshot: {
      price: Number,
      deliveryDays: Number,
      revisions: Number,
    },
    status: {
      type: String,
      enum: [
        "pending",            // client sent request, awaiting freelancer
        "accepted",           // freelancer accepted, client fills requirements
        "rejected",           // freelancer rejected
        "in_progress",        // requirements submitted, work ongoing
        "delivered",          // freelancer submitted delivery
        "completed",          // client marked complete
        "cancelled",
      ],
      default: "pending",
    },
    clientNote: { type: String, default: "" },
    requirements: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      instructions: { type: String, default: "" },
      files: [{ name: String, url: String }],
    },
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    rejectionReason: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("GigOrder", gigOrderSchema);
