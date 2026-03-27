const Gig = require("../models/Gig");
const User = require("../models/User");

// ── CREATE ───────────────────────────────────────────────────────────────────
const createGig = async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can create gigs" });
    }

    // Gallery: files uploaded via multer + any existing URL strings
    const uploadedGallery = req.files
      ? req.files.map((f) => `http://localhost:5000/uploads/${f.filename}`)
      : [];
    let existingGallery = [];
    if (req.body.gallery) {
      existingGallery = Array.isArray(req.body.gallery)
        ? req.body.gallery
        : [req.body.gallery];
    }
    const gallery = [...existingGallery, ...uploadedGallery];

    // Parse packages (sent as JSON string when using FormData)
    let packages = req.body.packages;
    if (typeof packages === "string") {
      try { packages = JSON.parse(packages); } catch (_) {}
    }

    // Parse tags
    let tags = req.body.tags || [];
    if (typeof tags === "string") {
      tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
    }

    const gig = await Gig.create({
      freelancer: req.user._id,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      tags,
      packages,
      gallery,
    });

    await gig.populate("freelancer", "name avatar averageRating completedProjects skills");
    res.status(201).json(gig);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── UPDATE ───────────────────────────────────────────────────────────────────
const updateGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: "Gig not found" });
    if (String(gig.freelancer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your gig" });
    }

    // New gallery files
    if (req.files && req.files.length > 0) {
      const newFiles = req.files.map((f) => `http://localhost:5000/uploads/${f.filename}`);
      req.body.gallery = [...(gig.gallery || []), ...newFiles];
    }

    // Parse packages if needed
    if (typeof req.body.packages === "string") {
      try { req.body.packages = JSON.parse(req.body.packages); } catch (_) {}
    }

    Object.assign(gig, req.body);
    await gig.save();
    await gig.populate("freelancer", "name avatar averageRating completedProjects skills");
    res.json(gig);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── DELETE (soft) ─────────────────────────────────────────────────────────────
const deleteGig = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: "Gig not found" });
    if (String(gig.freelancer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your gig" });
    }
    gig.isActive = false;
    await gig.save();
    res.json({ message: "Gig deactivated" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── LIST (search + filter) ────────────────────────────────────────────────────
const getGigs = async (req, res) => {
  try {
    const { category, search, sort, minPrice, maxPrice } = req.query;
    const query = { isActive: true };

    if (category && category !== "All") query.category = category;

    if (search) {
      query.$text = { $search: search };
    }

    if (minPrice || maxPrice) {
      const min = Number(minPrice) || 0;
      const max = Number(maxPrice) || Infinity;
      // Filter by basic package price range
      query["packages.basic.price"] = {};
      if (minPrice) query["packages.basic.price"].$gte = min;
      if (maxPrice && maxPrice !== "Infinity") query["packages.basic.price"].$lte = max;
    }

    let sortOption = { createdAt: -1 };
    if (sort === "rating") sortOption = { averageRating: -1 };
    if (sort === "orders") sortOption = { totalOrders: -1 };

    const gigs = await Gig.find(query)
      .populate("freelancer", "name avatar averageRating completedProjects skills")
      .sort(sortOption)
      .limit(60);

    res.json(gigs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── SINGLE GIG ────────────────────────────────────────────────────────────────
const getGigById = async (req, res) => {
  try {
    const gig = await Gig.findOne({ _id: req.params.id, isActive: true }).populate(
      "freelancer",
      "name avatar bio skills averageRating completedProjects experience certifications"
    );
    if (!gig) return res.status(404).json({ message: "Gig not found" });
    res.json(gig);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── BY FREELANCER ─────────────────────────────────────────────────────────────
const getGigsByFreelancer = async (req, res) => {
  try {
    const gigs = await Gig.find({ freelancer: req.params.freelancerId, isActive: true })
      .populate("freelancer", "name avatar averageRating completedProjects skills")
      .sort({ createdAt: -1 });
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── FEATURED ──────────────────────────────────────────────────────────────────
const getFeaturedGigs = async (req, res) => {
  try {
    const gigs = await Gig.find({ isActive: true })
      .populate("freelancer", "name avatar averageRating completedProjects skills")
      .sort({ averageRating: -1, totalOrders: -1 })
      .limit(8);
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── BOOKMARK TOGGLE ───────────────────────────────────────────────────────────
const toggleBookmark = async (req, res) => {
  try {
    const gig = await Gig.findById(req.params.id);
    if (!gig) return res.status(404).json({ message: "Gig not found" });

    const userId = req.user._id;
    const isBookmarked = gig.bookmarkedBy.some((id) => String(id) === String(userId));

    if (isBookmarked) {
      gig.bookmarkedBy = gig.bookmarkedBy.filter((id) => String(id) !== String(userId));
    } else {
      gig.bookmarkedBy.push(userId);
    }
    await gig.save();
    res.json({ bookmarked: !isBookmarked, count: gig.bookmarkedBy.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET BOOKMARKED GIGS for current user ──────────────────────────────────────
const getMyBookmarks = async (req, res) => {
  try {
    const gigs = await Gig.find({ bookmarkedBy: req.user._id, isActive: true })
      .populate("freelancer", "name avatar averageRating completedProjects skills")
      .sort({ updatedAt: -1 });
    res.json(gigs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createGig,
  updateGig,
  deleteGig,
  getGigs,
  getGigById,
  getGigsByFreelancer,
  getFeaturedGigs,
  toggleBookmark,
  getMyBookmarks,
};
