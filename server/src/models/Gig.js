const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({
  price: { type: Number, required: true, default: 0 },
  deliveryDays: { type: Number, required: true, default: 3 },
  revisions: { type: Number, default: 1 },
  features: [{ type: String }],
}, { _id: false });

const gigSchema = new mongoose.Schema(
  {
    freelancer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      required: true,
      enum: ["Design", "Development", "Writing", "Marketing", "Video", "Music", "Data", "Other"],
    },
    tags: [{ type: String }],
    packages: {
      basic: { type: packageSchema, default: () => ({}) },
      standard: { type: packageSchema, default: () => ({}) },
      premium: { type: packageSchema, default: () => ({}) },
    },
    gallery: [{ type: String }],          // image / video URLs
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    totalOrders: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

// text index for search
gigSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Gig", gigSchema);
