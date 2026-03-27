import { useEffect, useState, useRef } from "react";
import api from "../api";
import { socket } from "../socket";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Workspace() {
  const { id } = useParams();
  const { auth } = useAuth();
  const [projects, setProjects] = useState([]);
  const [activeProj, setActiveProj] = useState(id || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskAssignee, setNewTaskAssignee] = useState("freelancer");
  const [newFile, setNewFile] = useState(null);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState("");
  const [newMilestoneAmount, setNewMilestoneAmount] = useState("");

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [hasReviewed, setHasReviewed] = useState(false);

  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchProjects();
  }, [activeProj]);

  const fetchProjects = () => {
    api.get("/projects").then(r => {
      setProjects(r.data);
      if (!activeProj && r.data.length > 0) setActiveProj(r.data[0]._id);
    }).catch(console.error);
  };

  useEffect(() => {
    if (activeProj) {
      api.get(`/projects/${activeProj}/messages`).then(r => setMessages(r.data)).catch(console.error);
      api.get(`/projects/${activeProj}/reviews/my`).then(r => {
        if (r.data) {
          setReviewRating(r.data.rating);
          setReviewComment(r.data.comment);
          setHasReviewed(true);
        } else {
          setReviewRating(5);
          setReviewComment("");
          setHasReviewed(false);
        }
      }).catch(() => {
        setReviewRating(5);
        setReviewComment("");
        setHasReviewed(false);
      });
    }
  }, [activeProj]);

  useEffect(() => {
    const handler = (msg) => {
      if (msg.project === activeProj) {
        setMessages(prev => [...prev, msg]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    };
    socket.on("newMessage", handler);
    return () => socket.off("newMessage", handler);
  }, [activeProj]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const { data } = await api.post(`/projects/${activeProj}/messages`, { text });
    setMessages(prev => [...prev, data]);
    setText("");
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const updateProgress = async (e) => {
    const val = parseInt(e.target.value, 10);
    try {
      await api.put(`/projects/${activeProj}`, { progress: val });
      setProjects(prev => prev.map(p => p._id === activeProj ? { ...p, progress: val } : p));
    } catch (error) { console.error(error); }
  };

  const markCompleted = async () => {
    if (!window.confirm("Are you sure you want to mark this project as completed?")) return;
    try {
      await api.put(`/projects/${activeProj}`, { status: "completed", progress: 100 });
      fetchProjects();
    } catch (e) { console.error(e); }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/projects/${activeProj}/reviews`, { rating: reviewRating, comment: reviewComment });
      setHasReviewed(true);
      alert("Review saved successfully!");
    } catch (e) {
      console.error(e);
      alert("Failed to save review.");
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const { data } = await api.post(`/projects/${activeProj}/tasks`, {
        title: newTaskTitle, assignedTo: newTaskAssignee
      });
      setProjects(prev => prev.map(p => p._id === activeProj ? data : p));
      setNewTaskTitle("");
    } catch (e) { console.error(e); }
  };

  const handleTaskStatus = async (taskId, status) => {
    try {
      const { data } = await api.put(`/projects/${activeProj}/tasks/${taskId}`, { status });
      setProjects(prev => prev.map(p => p._id === activeProj ? data : p));
    } catch (e) { console.error(e); }
  };

  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!newFile) return;
    try {
      const fd = new FormData();
      fd.append("file", newFile);
      const { data } = await api.post(`/projects/${activeProj}/files`, fd);
      setProjects(prev => prev.map(p => p._id === activeProj ? data : p));
      setNewFile(null);
    } catch (e) { console.error(e); }
  };

  const handleCreateMilestone = async (e) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || !newMilestoneAmount) return;
    try {
      const { data } = await api.post(`/projects/${activeProj}/milestones`, {
        title: newMilestoneTitle, amount: Number(newMilestoneAmount)
      });
      setProjects(prev => prev.map(p => p._id === activeProj ? data : p));
      setNewMilestoneTitle("");
      setNewMilestoneAmount("");
    } catch (e) { console.error(e); }
  };

  const handleToggleMilestone = async (milestoneId) => {
    try {
      const { data } = await api.put(`/projects/${activeProj}/milestones/${milestoneId}`);
      setProjects(prev => prev.map(p => p._id === activeProj ? data : p));
    } catch (e) { console.error(e); }
  };

  const activeProjectObj = projects.find(p => p._id === activeProj);

  return (
    <div className="page-container workspace-layout">
      <div className="sidebar glass-panel flex-col">
        <h3>My Workspaces</h3>
        {projects.length === 0 ? <p className="muted" style={{ padding: "1rem" }}>No projects yet.</p> : null}
        {projects.map(p => (
          <div key={p._id} className={`nav-item ${activeProj === p._id ? "active" : ""}`} onClick={() => setActiveProj(p._id)}>
            <div style={{ fontWeight: "bold" }}>{p.job?.title || p.title || "Untitled Project"}</div>
            <div className="muted" style={{ fontSize: "0.80rem" }}>Status: <span style={{ textTransform: "capitalize", color: p.status === "completed" ? "#10b981" : "inherit" }}>{p.status}</span></div>
          </div>
        ))}
      </div>

      <div className="workspace-main" style={{ display: "flex", flex: 1, gap: "1rem", overflow: "hidden" }}>
        {activeProj && activeProjectObj ? (
          <div className="glass-panel flex-col" style={{ flex: 1, overflowY: "auto" }}>

            {/* TABS */}
            <div style={{ display: "flex", gap: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "10px", marginBottom: "1rem", overflowX: "auto" }}>
              {[
                { id: "overview", label: "📊 Overview" },
                { id: "tasks", label: "📋 Tasks" },
                { id: "milestones", label: "🎯 Milestones" },
                { id: "files", label: "📂 Files" },
                { id: "chat", label: "💬 Chat" }
              ].map(t => (
                <button key={t.id} className="btn-icon"
                  style={{
                    textTransform: "capitalize",
                    fontWeight: activeTab === t.id ? "bold" : "600",
                    color: activeTab === t.id ? "#3b82f6" : "rgba(255,255,255,0.6)",
                    borderBottom: activeTab === t.id ? "2px solid #3b82f6" : "2px solid transparent",
                    borderRadius: 0,
                    padding: "5px 10px",
                    background: "none", cursor: "pointer", transition: "all 0.2s"
                  }}
                  onClick={() => setActiveTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div className="flex-col" style={{ gap: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
                  <div>
                    <h3>{activeProjectObj.job?.title || "Project"} Overview</h3>
                    <p className="muted" style={{ fontSize: "0.85rem", marginTop: "5px" }}>Client: <Link to={`/profile/${activeProjectObj.client?._id}`} style={{ color: "#3b82f6", textDecoration: "none" }}>{activeProjectObj.client?.name}</Link></p>
                    <p className="muted" style={{ fontSize: "0.85rem" }}>Freelancer: <Link to={`/profile/${activeProjectObj.freelancer?._id}`} style={{ color: "#3b82f6", textDecoration: "none" }}>{activeProjectObj.freelancer?.name}</Link></p>
                  </div>
                  <div style={{ background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                    {activeProjectObj.budget && <div><b>Budget:</b> ${activeProjectObj.budget}</div>}
                    {activeProjectObj.deadline && <div><b>Deadline:</b> {new Date(activeProjectObj.deadline).toLocaleDateString()}</div>}
                    <div><b>Status:</b> <span className="badge" style={{ textTransform: "capitalize", marginLeft: "10px" }}>{activeProjectObj.status}</span></div>
                  </div>
                </div>

                <div className="progress-container" style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label>Overall Progress: {activeProjectObj.progress || 0}%</label>
                  <input type="range" min="0" max="100" value={activeProjectObj.progress || 0} onChange={updateProgress} style={{ width: "100%" }} />
                </div>

                <div>
                  <h4>Scope & Deliverables</h4>
                  <p style={{ fontSize: "0.9rem", marginTop: "0.5rem", whiteSpace: "pre-wrap", background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--glass-border)", color: "var(--text-primary)" }}>{activeProjectObj.scope}</p>
                </div>

                {activeProjectObj.status !== "completed" && auth.user.role === "client" && (
                  <button className="btn-primary" onClick={markCompleted} style={{ alignSelf: "flex-start", background: "#10b981" }}>Mark Complete</button>
                )}

                {activeProjectObj.status === "completed" && auth.user.role === "client" && activeProjectObj.gigOrder?.gig && (
                  <div style={{ marginTop: "1rem", padding: "1rem", background: "rgba(59, 130, 246, 0.1)", borderRadius: "8px", border: "1px solid rgba(59, 130, 246, 0.2)", display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                    <div>
                      <h4 style={{ margin: 0, color: "#3b82f6" }}>Need this service again?</h4>
                      <p style={{ margin: "4px 0 0", fontSize: "0.85rem", color: "var(--text-muted)" }}>You can easily reorder this gig from {activeProjectObj.freelancer?.name}.</p>
                    </div>
                    <Link to={`/gigs/${activeProjectObj.gigOrder.gig._id}`}>
                      <button className="btn-primary" style={{ background: "#3b82f6", color: "white", padding: "0.6rem 1.2rem", fontWeight: "bold" }}>
                        🔄 Order Again
                      </button>
                    </Link>
                  </div>
                )}

                {auth.user.role === "client" && (
                  <form onSubmit={handleReviewSubmit} style={{ background: "rgba(16, 185, 129, 0.1)", padding: "1rem", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
                    <h4 style={{ color: "#10b981", margin: 0 }}>{hasReviewed ? "Your Review" : "Leave a Formative Review"}</h4>
                    <select value={reviewRating} onChange={e => setReviewRating(Number(e.target.value))} style={{ padding: "10px", width: "100%" }}>
                      <option value={5}>⭐⭐⭐⭐⭐ (5/5)</option>
                      <option value={4}>⭐⭐⭐⭐ (4/5)</option>
                      <option value={3}>⭐⭐⭐ (3/5)</option>
                      <option value={2}>⭐⭐ (2/5)</option>
                      <option value={1}>⭐ (1/5)</option>
                    </select>
                    <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} placeholder="Write your feedback..." rows={3}></textarea>
                    <button className="btn-primary" style={{ alignSelf: "flex-start", background: "#10b981", color: "white" }}>{hasReviewed ? "Update Review" : "Submit Review"}</button>
                  </form>
                )}
              </div>
            )}

            {/* TASKS TAB */}
            {activeTab === "tasks" && (
              <div className="flex-col">
                <form onSubmit={handleCreateTask} style={{ display: "flex", gap: "10px", marginBottom: "1rem", flexWrap: "wrap" }}>
                  <input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="New task..." style={{ flex: 1 }} />
                  <select value={newTaskAssignee} onChange={e => setNewTaskAssignee(e.target.value)} style={{ width: "150px" }}>
                    <option value="freelancer">Freelancer</option>
                    <option value="client">Client</option>
                  </select>
                  <button className="btn-primary">Add Task</button>
                </form>
                {(!activeProjectObj.tasks || activeProjectObj.tasks.length === 0) && <p className="muted">No tasks yet.</p>}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                  {["todo", "in_progress", "done"].map(status => (
                    <div key={status} style={{ background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                      <h4 style={{ textTransform: "capitalize", borderBottom: "1px solid var(--glass-border)", paddingBottom: "10px", margin: "0 0 10px 0", color: "var(--text-primary)" }}>{status.replace("_", " ")}</h4>
                      {activeProjectObj.tasks?.filter(t => t.status === status).map(t => (
                        <div key={t._id} style={{ background: "var(--glass-bg)", padding: "10px", borderRadius: "4px", marginBottom: "10px", fontSize: "0.9rem", border: "1px solid var(--glass-border)" }}>
                          <div><b>{t.title}</b></div>
                          <div className="muted" style={{ fontSize: "0.75rem", marginBottom: "5px" }}>Assigned to: <span style={{ textTransform: "capitalize" }}>{t.assignedTo}</span></div>
                          <select value={t.status} onChange={e => handleTaskStatus(t._id, e.target.value)} style={{ padding: "4px", fontSize: "0.8rem", width: "100%" }}>
                            <option value="todo">To Do</option>
                            <option value="in_progress">In Progress</option>
                            <option value="done">Done</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MILESTONES TAB */}
            {activeTab === "milestones" && (
              <div className="flex-col">
                {auth.user.role === "client" && (
                  <form onSubmit={handleCreateMilestone} style={{ display: "flex", gap: "10px", marginBottom: "1rem", flexWrap: "wrap" }}>
                    <input type="text" value={newMilestoneTitle} onChange={e => setNewMilestoneTitle(e.target.value)} placeholder="Milestone..." style={{ flex: 1 }} />
                    <input type="number" value={newMilestoneAmount} onChange={e => setNewMilestoneAmount(e.target.value)} placeholder="Amount $" style={{ width: "120px" }} />
                    <button className="btn-primary">Add</button>
                  </form>
                )}
                {(!activeProjectObj.milestones || activeProjectObj.milestones.length === 0) && <p className="muted">No milestones defined.</p>}
                {activeProjectObj.milestones?.map(m => (
                  <div key={m._id} style={{ display: "flex", gap: "15px", alignItems: "center", background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                    <input type="checkbox" checked={m.isCompleted} onChange={() => handleToggleMilestone(m._id)} style={{ width: "20px", height: "20px" }} />
                    <div style={{ flex: 1, textDecoration: m.isCompleted ? "line-through" : "none", opacity: m.isCompleted ? 0.6 : 1 }}>
                      <b>{m.title}</b>
                    </div>
                    <div className="badge">${m.amount}</div>
                  </div>
                ))}
              </div>
            )}

            {/* FILES TAB */}
            {activeTab === "files" && (
              <div className="flex-col">
                <form onSubmit={handleUploadFile} style={{ display: "flex", gap: "10px", alignItems: "center", background: "var(--bg-secondary)", padding: "1rem", borderRadius: "8px", border: "1px solid var(--glass-border)" }}>
                  <input type="file" onChange={e => setNewFile(e.target.files[0])} />
                  <button className="btn-primary" disabled={!newFile}>Upload File</button>
                </form>
                {(!activeProjectObj.files || activeProjectObj.files.length === 0) && <p className="muted" style={{ marginTop: "1rem" }}>No files uploaded yet.</p>}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
                  {activeProjectObj.files?.map(f => (
                    <a key={f._id} href={f.url} target="_blank" rel="noreferrer" style={{ background: "rgba(0,0,0,0.2)", padding: "1rem", borderRadius: "8px", textDecoration: "none", color: "white", display: "flex", alignItems: "center", gap: "10px", border: "1px solid rgba(255,255,255,0.05)", transition: "0.2s" }} className="file-card">
                      <div style={{ fontSize: "2rem" }}>📄</div>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        <div style={{ fontWeight: "bold" }}>{f.name}</div>
                        <div className="muted" style={{ fontSize: "0.75rem" }}>{new Date(f.createdAt).toLocaleDateString()}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* CHAT TAB */}
            {activeTab === "chat" && (
              <div className="chat-area flex-col" style={{ flex: 1, height: "calc(100vh - 280px)" }}>
                <div className="chat-messages flex-col" style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
                  {messages.length === 0 && (
                    <div className="empty-state" style={{ flex: 1, border: "none", background: "transparent" }}>
                      <div className="empty-state-icon" style={{ fontSize: "2.5rem" }}>💬</div>
                      <h4 style={{ margin: "0 0 0.5rem", color: "var(--text-primary)" }}>Start the Conversation</h4>
                      <p>Send a message to discuss project details.</p>
                    </div>
                  )}
                  {messages.map(m => (
                    <div key={m._id} className="chat-bubble" style={{
                      background: m.from?._id === auth.user.id ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "rgba(255,255,255,0.08)",
                      color: m.from?._id === auth.user.id ? "#fff" : "var(--text-primary)",
                      alignSelf: m.from?._id === auth.user.id ? "flex-end" : "flex-start",
                      padding: "10px 16px", borderRadius: m.from?._id === auth.user.id ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      maxWidth: "75%", marginBottom: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                    }}>
                      <div style={{ fontSize: "0.7rem", color: m.from?._id === auth.user.id ? "rgba(255,255,255,0.8)" : "var(--text-muted)", marginBottom: "4px", fontWeight: 600 }}>{m.from?.name}</div>
                      <div style={{ lineHeight: 1.4, fontSize: "0.95rem" }}>{m.text}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={send} className="chat-input-row" style={{ display: "flex", gap: "10px", marginTop: "10px", background: "var(--bg-secondary)", padding: "10px", borderRadius: "12px", border: "1px solid var(--glass-border)" }}>
                  <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message..." style={{ flex: 1, padding: "10px 15px", borderRadius: "8px", border: "none", background: "rgba(0,0,0,0.2)" }} />
                  <button className="btn-primary" style={{ padding: "10px 20px", borderRadius: "8px" }}>Send</button>
                </form>
              </div>
            )}

          </div>
        ) : (
          <div className="glass-panel flex-col" style={{ flex: 1, alignItems: "center", justifyContent: "center", border: "none" }}>
            <div className="empty-state" style={{ background: "transparent", border: "none" }}>
              <div className="empty-state-icon" style={{ fontSize: "4rem" }}>🚀</div>
              <h3 style={{ color: "var(--text-primary)" }}>Welcome to Your Workspace</h3>
              <p style={{ maxWidth: "340px", margin: "0.5rem auto 0" }}>Select a project from the sidebar to view details, track progress, manage tasks, and chat with your team.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
