const Job = require("../models/Job");
const User = require("../models/User");

const getRecommendations = async (req, res) => {
  try {
    const user = req.user;
    if (user.role === "freelancer") {
      const jobs = await Job.find({ status: "active" }).populate("client", "name");
      const matched = jobs.map(job => {
        let score = 0;
        job.skills.forEach(s => {
          if (user.skills.includes(s)) score += 1;
        });
        return { ...job._doc, matchScore: score };
      }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
      return res.json({ type: "jobs", results: matched });
    } else {
      const myJobs = await Job.find({ client: user._id, status: "active" });
      const neededSkills = [...new Set(myJobs.flatMap(j => j.skills))];
      const freelancers = await User.find({ role: "freelancer" });
      const matched = freelancers.map(f => {
        let score = 0;
        f.skills.forEach(s => {
          if (neededSkills.includes(s)) score += 1;
        });
        return { ...f._doc, matchScore: score };
      }).sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
      return res.json({ type: "freelancers", results: matched });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getRecommendations };
