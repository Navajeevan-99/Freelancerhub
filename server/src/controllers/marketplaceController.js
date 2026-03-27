const Job = require("../models/Job");
const Proposal = require("../models/Proposal");
const Project = require("../models/Project");
const Message = require("../models/Message");
const Review = require("../models/Review");
const User = require("../models/User");
const Notification = require("../models/Notification");
const Work = require("../models/Work");

const createJob = async (req, res) => {
  try {
    const job = await Job.create({ ...req.body, client: req.user._id });
    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getJobs = async (req, res) => {
  try {
    const { category, minBudget, maxBudget, skill, recentHours } = req.query;
    const q = { status: "active" };
    if (category) q.category = category;
    if (minBudget || maxBudget) {
      q.budgetMax = {};
      if (minBudget) q.budgetMax.$gte = Number(minBudget);
      if (maxBudget) q.budgetMax.$lte = Number(maxBudget);
    }
    if (skill) q.skills = { $in: [skill] };
    if (recentHours) {
      q.createdAt = { $gte: new Date(Date.now() - Number(recentHours) * 60 * 60 * 1000) };
    }
    const jobs = await Job.find(q).populate("client", "name avatar").sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProposal = async (req, res) => {
  try {
    const { jobId } = req.params;
    const proposal = await Proposal.create({
      ...req.body,
      job: jobId,
      freelancer: req.user._id,
    });
    const job = await Job.findById(jobId);
    await Notification.create({
      user: job.client,
      type: "proposal",
      message: `${req.user.name} submitted a proposal for ${job.title}`,
    });
    res.status(201).json(proposal);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProposalsForClient = async (req, res) => {
  const proposals = await Proposal.find()
    .populate("job")
    .populate("freelancer", "name avatar averageRating completedProjects")
    .sort({ createdAt: -1 });
  const filtered = proposals.filter((p) => String(p.job.client) === String(req.user._id));
  res.json(filtered);
};

const acceptProposal = async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.proposalId).populate("job");
    if (!proposal) return res.status(404).json({ message: "Proposal not found" });
    if (String(proposal.job.client) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your job" });
    }
    proposal.status = "accepted";
    await proposal.save();
    await Proposal.updateMany(
      { job: proposal.job._id, _id: { $ne: proposal._id } },
      { status: "rejected" }
    );
    await Job.findByIdAndUpdate(proposal.job._id, { status: "in_progress" });
    const project = await Project.create({
      job: proposal.job._id,
      client: proposal.job.client,
      freelancer: proposal.freelancer,
      scope: proposal.job.description,
      budget: proposal.job.budgetMax,
      deadline: proposal.job.deadline,
    });
    await Notification.create({
      user: proposal.freelancer,
      type: "accepted",
      message: `Your proposal for "${proposal.job.title}" was accepted`,
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProjects = async (req, res) => {
  const projects = await Project.find({
    $or: [{ client: req.user._id }, { freelancer: req.user._id }],
  })
    .populate("job", "title")
    .populate("client", "name avatar")
    .populate("freelancer", "name avatar")
    .populate("files.uploadedBy", "name avatar")
    .populate({ path: "gigOrder", populate: { path: "gig", select: "title category packages gallery" } })
    .sort({ updatedAt: -1 });
  res.json(projects);
};

const createProject = async (req, res) => {
  try {
    const { jobId, freelancerId, scope } = req.body;
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: "Job not found" });
    if (String(job.client) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not your job" });
    }
    const project = await Project.create({
      job: job._id,
      client: req.user._id,
      freelancer: freelancerId,
      scope: scope || job.description,
      budget: job.budgetMax,
      deadline: job.deadline,
    });
    await Job.findByIdAndUpdate(jobId, { status: "in_progress" });
    await Notification.create({
      user: freelancerId,
      type: "project_created",
      message: `A new project "${job.title}" has been created for you`,
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProject = async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return res.status(404).json({ message: "Project not found" });
  if (![String(project.client), String(project.freelancer)].includes(String(req.user._id))) {
    return res.status(403).json({ message: "Not allowed" });
  }
  
  const oldStatus = project.status;
  Object.assign(project, req.body);
  await project.save();

  if (oldStatus !== "completed" && project.status === "completed" && project.gigOrder) {
    const GigOrder = require("../models/GigOrder");
    const User = require("../models/User");
    await GigOrder.findByIdAndUpdate(project.gigOrder, { status: "completed" });
    const completedCount = await GigOrder.countDocuments({
      freelancer: project.freelancer,
      status: "completed",
    });
    await User.findByIdAndUpdate(project.freelancer, { completedProjects: completedCount });
  }

  await Notification.create({
    user: String(project.client) === String(req.user._id) ? project.freelancer : project.client,
    type: "project_update",
    message: `Project progress/status updated`,
  });
  res.json(project);
};

const sendMessage = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });
    const to = String(project.client) === String(req.user._id) ? project.freelancer : project.client;
    let message = await Message.create({
      project: project._id,
      from: req.user._id,
      to,
      text: req.body.text,
    });
    message = await message.populate("from", "name avatar");
    const notification = await Notification.create({
      user: to,
      type: "message",
      message: `New message in project`,
    });

    const io = req.app.get("io");
    const users = req.app.get("users");
    if (io && users && users[to]) {
      io.to(users[to]).emit("newMessage", message);
      io.to(users[to]).emit("newNotification", notification);
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMessages = async (req, res) => {
  const messages = await Message.find({ project: req.params.projectId })
    .populate("from", "name avatar")
    .sort({ createdAt: 1 });
  res.json(messages);
};

const createReview = async (req, res) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return res.status(404).json({ message: "Project not found" });
  const to = String(project.client) === String(req.user._id) ? project.freelancer : project.client;
  
  let review = await Review.findOne({ project: project._id, from: req.user._id });
  
  if (review) {
    review.rating = req.body.rating;
    review.comment = req.body.comment || "";
    await review.save();
  } else {
    review = await Review.create({
      project: project._id,
      from: req.user._id,
      to,
      rating: req.body.rating,
      comment: req.body.comment || "",
    });
  }

  const ratings = await Review.find({ to });
  const avg = ratings.length ? ratings.reduce((a, c) => a + c.rating, 0) / ratings.length : 0;
  const completed = await Project.countDocuments({ freelancer: to, status: "completed" });
  await User.findByIdAndUpdate(to, { averageRating: avg.toFixed(2), completedProjects: completed });
  res.status(200).json(review);
};

const getProjectReview = async (req, res) => {
  try {
    const review = await Review.findOne({ project: req.params.projectId, from: req.user._id });
    res.json(review || null);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLeaderboard = async (_req, res) => {
  const freelancers = await User.find({ role: "freelancer" })
    .sort({ averageRating: -1, completedProjects: -1 })
    .select("name skills averageRating completedProjects");
  res.json(freelancers);
};

const inviteFreelancer = async (req, res) => {
  const { freelancerId } = req.body;
  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ message: "Job not found" });
  if (String(job.client) !== String(req.user._id)) {
    return res.status(403).json({ message: "Not your job" });
  }
  if (!job.invitedFreelancers.includes(freelancerId)) {
    job.invitedFreelancers.push(freelancerId);
    await job.save();
  }
  await Notification.create({
    user: freelancerId,
    type: "invite",
    message: `You were invited to apply for: ${job.title}`,
  });
  res.json({ message: "Invitation sent" });
};

const getNotifications = async (req, res) => {
  const data = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(data);
};

const getDashboard = async (req, res) => {
  const activeProjects = await Project.countDocuments({
    $or: [{ client: req.user._id }, { freelancer: req.user._id }],
    status: { $ne: "completed" },
  });
  const completedProjects = await Project.countDocuments({
    $or: [{ client: req.user._id }, { freelancer: req.user._id }],
    status: "completed",
  });
  const pendingProposals = await Proposal.countDocuments({
    freelancer: req.user._id,
    status: "pending",
  });

  res.json({ activeProjects, completedProjects, pendingProposals });
};

const createWork = async (req, res) => {
  try {
    if (req.user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancers can add works" });
    }
    const uploadedMedia = req.files ? req.files.map(f => `http://localhost:5000/uploads/${f.filename}`) : [];
    let existingMediaUrls = [];
    if (req.body.mediaUrls) {
      existingMediaUrls = Array.isArray(req.body.mediaUrls) ? req.body.mediaUrls : [req.body.mediaUrls];
    }
    const allMedia = [...existingMediaUrls, ...uploadedMedia];
    
    const payload = {
      ...req.body,
      freelancer: req.user._id,
      mediaUrls: allMedia,
      tags: (req.body.tags || []).filter(Boolean),
    };
    
    // Convert string tags if any
    if (typeof payload.tags === "string") {
      payload.tags = payload.tags.split(",").map(t => t.trim()).filter(Boolean);
    }

    const work = await Work.create(payload);
    // Populate freelancer so it can be pushed immediately in frontend
    await work.populate("freelancer", "name avatar");
    res.status(201).json(work);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getWorks = async (req, res) => {
  try {
    const q = {};
    if (req.query.freelancerId) q.freelancer = req.query.freelancerId;
    const works = await Work.find(q)
      .populate("freelancer", "name avatar skills averageRating completedProjects")
      .populate("likes", "name avatar")
      .populate("comments.user", "name avatar")
      .sort({ createdAt: -1 });
    res.json(works);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const likeWork = async (req, res) => {
  try {
    const work = await Work.findById(req.params.workId);
    if (!work.likes.includes(req.user._id)) {
      work.likes.push(req.user._id);
      await work.save();
    } else {
      work.likes = work.likes.filter(id => id.toString() !== req.user._id.toString());
      await work.save();
    }
    res.json(work);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const commentWork = async (req, res) => {
  try {
    const work = await Work.findById(req.params.workId);
    work.comments.push({ user: req.user._id, text: req.body.text });
    await work.save();
    res.status(201).json(work);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    project.tasks.push(req.body);
    await project.save();
    res.json(project);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const updateTaskStatus = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    const task = project.tasks.id(req.params.taskId);
    task.status = req.body.status;
    await project.save();
    res.json(project);
  } catch (error) { res.status(500).json({ message: error.message }); }
};

const uploadProjectFile = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!req.file) return res.status(400).json({ message: "No file provided" });
    const fileObj = {
      name: req.file.originalname,
      url: `http://localhost:5000/uploads/${req.file.filename}`,
      uploadedBy: req.user._id,
    };
    project.files.push(fileObj);
    await project.save();
    res.json(project);
  } catch(e) { res.status(500).json({ message: e.message }); }
};

const createMilestone = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    project.milestones.push(req.body);
    await project.save();
    res.json(project);
  } catch(e) { res.status(500).json({ message: e.message }); }
};

const toggleMilestone = async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    const ms = project.milestones.id(req.params.milestoneId);
    ms.isCompleted = !ms.isCompleted;
    await project.save();
    res.json(project);
  } catch(e){ res.status(500).json({ message: e.message }); }
};

module.exports = {
  createJob,
  getJobs,
  createProposal,
  getProposalsForClient,
  acceptProposal,
  getProjects,
  createProject,
  updateProject,
  sendMessage,
  getMessages,
  createReview,
  getProjectReview,
  getLeaderboard,
  inviteFreelancer,
  getNotifications,
  getDashboard,
  createWork,
  getWorks,
  likeWork,
  commentWork,
  createTask,
  updateTaskStatus,
  uploadProjectFile,
  createMilestone,
  toggleMilestone,
};
