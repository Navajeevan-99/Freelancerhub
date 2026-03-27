const Connection = require("../models/Connection");
const User = require("../models/User");
const Notification = require("../models/Notification");

const requestConnection = async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (String(req.user._id) === String(recipientId)) {
      return res.status(400).json({ message: "Cannot connect to yourself" });
    }

    const existing = await Connection.findOne({
      $or: [
        { requester: req.user._id, recipient: recipientId },
        { requester: recipientId, recipient: req.user._id }
      ]
    });

    if (existing) {
      return res.status(400).json({ message: "Connection already exists or is pending" });
    }

    const connection = await Connection.create({
      requester: req.user._id,
      recipient: recipientId,
      status: "pending"
    });

    await Notification.create({
      user: recipientId,
      type: "connection_request",
      message: `${req.user.name} sent you a connection request`
    });

    res.status(201).json(connection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const acceptConnection = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const connection = await Connection.findById(connectionId);

    if (!connection) return res.status(404).json({ message: "Connection not found" });
    if (String(connection.recipient) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not authorized to accept this connection" });
    }

    connection.status = "accepted";
    await connection.save();

    await User.findByIdAndUpdate(connection.requester, { $inc: { completedProjects: 0 } }); // Just placeholder for connection stats if needed later
    
    await Notification.create({
      user: connection.requester,
      type: "connection_accepted",
      message: `${req.user.name} accepted your connection request`
    });

    res.json(connection);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConnections = async (req, res) => {
  try {
    const connections = await Connection.find({
      $or: [{ requester: req.user._id }, { recipient: req.user._id }]
    })
    .populate("requester", "name avatar role skills")
    .populate("recipient", "name avatar role skills")
    .sort({ updatedAt: -1 });

    res.json(connections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDiscoverConnections = async (req, res) => {
  try {
    const myId = req.user._id;
    // Get existing connections logic
    const existingConnections = await Connection.find({
      $or: [{ requester: myId }, { recipient: myId }]
    });

    const excludeIds = existingConnections.map(c => 
      String(c.requester) === String(myId) ? String(c.recipient) : String(c.requester)
    );
    excludeIds.push(String(myId));

    // Recommend users not in excludeIds, ideally different roles or matching skills
    // We'll just return random 10 for discover page
    let discover = await User.find({ _id: { $nin: excludeIds } })
      .select("name avatar role skills bio averageRating")
      .limit(20);

    res.json(discover);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  requestConnection,
  acceptConnection,
  getConnections,
  getDiscoverConnections
};
