const GigOrder = require("../models/GigOrder");
const Gig = require("../models/Gig");
const Project = require("../models/Project");
const Notification = require("../models/Notification");
const User = require("../models/User");

// ── Emit helper ──────────────────────────────────────────────────────────────
const emitTo = (req, userId, event, payload) => {
  const io = req.app.get("io");
  const users = req.app.get("users");
  if (io && users && users[String(userId)]) {
    io.to(users[String(userId)]).emit(event, payload);
  }
};

// ── CREATE ORDER (client sends request) ──────────────────────────────────────
const createOrder = async (req, res) => {
  try {
    if (req.user.role !== "client") {
      return res.status(403).json({ message: "Only clients can place orders" });
    }
    const { gigId, selectedPackage, clientNote } = req.body;

    const gig = await Gig.findOne({ _id: gigId, isActive: true });
    if (!gig) return res.status(404).json({ message: "Gig not found" });

    // Allowed: Client can place multiple orders for the same gig concurrently

    const pkg = gig.packages[selectedPackage];
    const order = await GigOrder.create({
      gig: gigId,
      client: req.user._id,
      freelancer: gig.freelancer,
      selectedPackage,
      packageSnapshot: {
        price: pkg.price,
        deliveryDays: pkg.deliveryDays,
        revisions: pkg.revisions,
      },
      clientNote: clientNote || "",
    });

    const notification = await Notification.create({
      user: gig.freelancer,
      type: "order_request",
      message: `${req.user.name} requested your gig "${gig.title}" (${selectedPackage} package)`,
    });

    emitTo(req, gig.freelancer, "newNotification", notification);

    await order.populate([
      { path: "gig", select: "title category gallery packages" },
      { path: "client", select: "name avatar" },
    ]);

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET CLIENT'S OWN ORDERS ─────────────────────────────────────────────────
const getMyOrders = async (req, res) => {
  try {
    const orders = await GigOrder.find({ client: req.user._id })
      .populate("gig", "title category gallery packages")
      .populate("freelancer", "name avatar averageRating")
      .populate("project", "_id status progress")
      .sort({ updatedAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET FREELANCER'S INCOMING REQUESTS ───────────────────────────────────────
const getIncomingRequests = async (req, res) => {
  try {
    const orders = await GigOrder.find({ freelancer: req.user._id })
      .populate("gig", "title category gallery packages")
      .populate("client", "name avatar")
      .populate("project", "_id status progress")
      .sort({ updatedAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── FREELANCER ACCEPT / REJECT ────────────────────────────────────────────────
const respondToOrder = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body; // action: "accept" | "reject"
    const order = await GigOrder.findById(req.params.id).populate("gig", "title");

    if (!order) return res.status(404).json({ message: "Order not found" });
    if (String(order.freelancer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your order" });
    }
    if (order.status !== "pending") {
      return res.status(400).json({ message: "Order is no longer pending" });
    }

    if (action === "reject") {
      order.status = "rejected";
      order.rejectionReason = rejectionReason || "";
      await order.save();

      const notif = await Notification.create({
        user: order.client,
        type: "order_rejected",
        message: `Your request for "${order.gig.title}" was declined`,
      });
      emitTo(req, order.client, "newNotification", notif);
      return res.json(order);
    }

    // Accept → create Project
    order.status = "accepted";
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (order.packageSnapshot?.deliveryDays || 7));

    const project = await Project.create({
      gigOrder: order._id,
      client: order.client,
      freelancer: order.freelancer,
      title: order.gig.title,
      scope: `Service request for "${order.gig.title}" – ${order.selectedPackage} package`,
      budget: order.packageSnapshot?.price,
      deadline: deliveryDate,
    });

    order.project = project._id;
    await order.save();

    // Update gig order count
    await Gig.findByIdAndUpdate(order.gig._id, { $inc: { totalOrders: 1 } });

    const notif = await Notification.create({
      user: order.client,
      type: "order_accepted",
      message: `Your request for "${order.gig.title}" was accepted! Please submit your requirements.`,
    });
    emitTo(req, order.client, "newNotification", notif);
    emitTo(req, order.client, "orderAccepted", { orderId: order._id, projectId: project._id });

    await order.populate([
      { path: "gig", select: "title category gallery" },
      { path: "client", select: "name avatar" },
      { path: "project", select: "_id status" },
    ]);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── CLIENT SUBMITS REQUIREMENTS ───────────────────────────────────────────────
const submitRequirements = async (req, res) => {
  try {
    const order = await GigOrder.findById(req.params.id).populate("gig", "title");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (String(order.client) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your order" });
    }
    if (order.status !== "accepted") {
      return res.status(400).json({ message: "Requirements can only be submitted for accepted orders" });
    }

    // Handle uploaded files
    const uploadedFiles = req.files
      ? req.files.map((f) => ({
          name: f.originalname,
          url: `http://localhost:5000/uploads/${f.filename}`,
        }))
      : [];

    let existingFiles = [];
    if (req.body.existingFiles) {
      try { existingFiles = JSON.parse(req.body.existingFiles); } catch(_) {}
    }

    order.requirements = {
      title: req.body.title || "",
      description: req.body.description || "",
      instructions: req.body.instructions || "",
      files: [...existingFiles, ...uploadedFiles],
    };
    order.status = "in_progress";
    await order.save();

    // Also update project scope with requirements
    if (order.project) {
      await Project.findByIdAndUpdate(order.project, {
        scope: `${req.body.description || ""}\n\n${req.body.instructions || ""}`.trim(),
        title: req.body.title || "",
      });
    }

    const notif = await Notification.create({
      user: order.freelancer,
      type: "requirements_submitted",
      message: `Client submitted requirements for "${order.gig.title}" — you can now start working!`,
    });
    emitTo(req, order.freelancer, "newNotification", notif);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── FREELANCER MARKS DELIVERED ────────────────────────────────────────────────
const markDelivered = async (req, res) => {
  try {
    const order = await GigOrder.findById(req.params.id).populate("gig", "title");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (String(order.freelancer) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your order" });
    }
    if (order.status !== "in_progress") {
      return res.status(400).json({ message: "Order must be in progress to deliver" });
    }

    order.status = "delivered";
    await order.save();

    if (order.project) {
      await Project.findByIdAndUpdate(order.project, { status: "review", progress: 100 });
    }

    const notif = await Notification.create({
      user: order.client,
      type: "order_delivered",
      message: `"${order.gig.title}" has been delivered! Please review and accept the work.`,
    });
    emitTo(req, order.client, "newNotification", notif);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── CLIENT MARKS COMPLETE ─────────────────────────────────────────────────────
const completeOrder = async (req, res) => {
  try {
    const order = await GigOrder.findById(req.params.id).populate("gig", "title");
    if (!order) return res.status(404).json({ message: "Order not found" });
    if (String(order.client) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your order" });
    }
    if (order.status !== "delivered") {
      return res.status(400).json({ message: "Order must be delivered first" });
    }

    order.status = "completed";
    await order.save();

    if (order.project) {
      await Project.findByIdAndUpdate(order.project, { status: "completed" });
    }

    // Update freelancer's completed projects count
    const completedCount = await GigOrder.countDocuments({
      freelancer: order.freelancer,
      status: "completed",
    });
    await User.findByIdAndUpdate(order.freelancer, { completedProjects: completedCount });

    const notif = await Notification.create({
      user: order.freelancer,
      type: "order_completed",
      message: `"${order.gig.title}" has been marked complete by the client!`,
    });
    emitTo(req, order.freelancer, "newNotification", notif);

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── GET SINGLE ORDER ──────────────────────────────────────────────────────────
const getOrderById = async (req, res) => {
  try {
    const order = await GigOrder.findById(req.params.id)
      .populate("gig", "title category gallery packages")
      .populate("client", "name avatar")
      .populate("freelancer", "name avatar skills averageRating")
      .populate("project");

    if (!order) return res.status(404).json({ message: "Order not found" });

    const isParticipant =
      String(order.client._id) === String(req.user._id) ||
      String(order.freelancer._id) === String(req.user._id);
    if (!isParticipant) return res.status(403).json({ message: "Not authorized" });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getIncomingRequests,
  respondToOrder,
  submitRequirements,
  markDelivered,
  completeOrder,
  getOrderById,
};
