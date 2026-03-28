const User = require("../models/User");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select("-password").populate("endorsements.endorser", "name avatar");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { bio, avatar, coverImage, experience, certifications, skills } = req.body;
    const user = await User.findById(req.user._id);
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (coverImage !== undefined) user.coverImage = coverImage;
    if (experience !== undefined) user.experience = experience;
    if (certifications !== undefined) user.certifications = certifications;
    if (skills !== undefined) user.skills = skills;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const endorseUser = async (req, res) => {
  try {
    const { skill, comment } = req.body;
    const { userId } = req.params;
    if (String(req.user._id) === userId) return res.status(400).json({ message: "Cannot endorse yourself" });
    const user = await User.findById(userId);
    user.endorsements.push({ endorser: req.user._id, skill, comment });
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    const user = await User.findById(req.user._id);
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    user.avatar = imageUrl;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadCover = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }
    const user = await User.findById(req.user._id);
    const imageUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    user.coverImage = imageUrl;
    await user.save();
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile, endorseUser, uploadAvatar, uploadCover };
