const express = require("express");
const { protect, onlyRole } = require("../middleware/auth");
const upload = require("../middleware/upload");
const ctrl = require("../controllers/marketplaceController");
const { getRecommendations } = require("../controllers/recommendationController");

const router = express.Router();
router.get("/recommendations", protect, getRecommendations);

router.get("/jobs", protect, ctrl.getJobs);
router.post("/jobs", protect, onlyRole("client"), ctrl.createJob);
router.post("/jobs/:jobId/proposals", protect, onlyRole("freelancer"), ctrl.createProposal);
router.get("/proposals/client", protect, onlyRole("client"), ctrl.getProposalsForClient);
router.put("/proposals/:proposalId/accept", protect, onlyRole("client"), ctrl.acceptProposal);
router.get("/projects", protect, ctrl.getProjects);
router.post("/projects", protect, onlyRole("client"), ctrl.createProject);
router.put("/projects/:projectId", protect, ctrl.updateProject);
router.post("/projects/:projectId/tasks", protect, ctrl.createTask);
router.put("/projects/:projectId/tasks/:taskId", protect, ctrl.updateTaskStatus);
router.post("/projects/:projectId/files", protect, upload.single("file"), ctrl.uploadProjectFile);
router.post("/projects/:projectId/milestones", protect, ctrl.createMilestone);
router.put("/projects/:projectId/milestones/:milestoneId", protect, ctrl.toggleMilestone);
router.get("/projects/:projectId/messages", protect, ctrl.getMessages);
router.post("/projects/:projectId/messages", protect, ctrl.sendMessage);
router.get("/projects/:projectId/reviews/my", protect, ctrl.getProjectReview);
router.post("/projects/:projectId/reviews", protect, ctrl.createReview);
router.get("/leaderboard", protect, ctrl.getLeaderboard);
router.post("/jobs/:jobId/invite", protect, onlyRole("client"), ctrl.inviteFreelancer);
router.get("/notifications", protect, ctrl.getNotifications);
router.get("/dashboard", protect, ctrl.getDashboard);
router.get("/works", protect, ctrl.getWorks);
router.post("/works", protect, onlyRole("freelancer"), upload.array("media", 4), ctrl.createWork);
router.post("/works/:workId/like", protect, ctrl.likeWork);
router.post("/works/:workId/comment", protect, ctrl.commentWork);

module.exports = router;
