const express = require("express");
const { protect, onlyRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const ctrl = require("../controllers/gigOrderController");

const router = express.Router();

// Client
router.post("/", protect, onlyRole("client"), ctrl.createOrder);
router.get("/mine", protect, onlyRole("client"), ctrl.getMyOrders);
router.put("/:id/requirements", protect, onlyRole("client"), upload.array("files", 10), ctrl.submitRequirements);
router.put("/:id/complete", protect, onlyRole("client"), ctrl.completeOrder);

// Freelancer
router.get("/requests", protect, onlyRole("freelancer"), ctrl.getIncomingRequests);
router.put("/:id/respond", protect, onlyRole("freelancer"), ctrl.respondToOrder);
router.put("/:id/deliver", protect, onlyRole("freelancer"), ctrl.markDelivered);

// Both participants
router.get("/:id", protect, ctrl.getOrderById);

module.exports = router;
