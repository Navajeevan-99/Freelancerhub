import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import GigCard from "../components/GigCard";
import { getImageUrl, getAvatarUrl } from "../utils/image";

export default function Profile() {
  const { id } = useParams();
  const { auth } = useAuth();
  const targetId = id || auth.user.id;
  const isOwner = auth.user.id === targetId;
  const [profile, setProfile] = useState(null);
  
  const [newSkill, setNewSkill] = useState("");
  const [clientJobs, setClientJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState("");

  const [connectionStatus, setConnectionStatus] = useState("null"); 
  const [connectionId, setConnectionId] = useState(null);
  const [works, setWorks] = useState([]);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [gigs, setGigs] = useState([]);
  const navigate = useNavigate();

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { data } = await api.put("/users/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setProfile({ ...profile, avatar: data.avatar });
    } catch (error) {
      console.error(error);
      alert("Failed to upload avatar.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingCover(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const { data } = await api.put("/users/profile/cover", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setProfile({ ...profile, coverImage: data.coverImage });
    } catch (error) {
      console.error(error);
      alert("Failed to upload banner.");
    } finally {
      setUploadingCover(false);
    }
  };

  useEffect(() => {
    api.get(`/users/${targetId}`).then(r => setProfile(r.data)).catch(console.error);
    api.get(`/works?freelancerId=${targetId}`).then(r => setWorks(r.data)).catch(console.error);
    api.get(`/gigs/freelancer/${targetId}`).then(r => setGigs(r.data)).catch(() => {});
    
    if (!isOwner) {
      api.get("/connections/mine").then(r => {
        const conn = r.data.find(c => String(c.requester._id) === targetId || String(c.recipient._id) === targetId);
        if (conn) {
          if (conn.status === "accepted") setConnectionStatus("connected");
          else if (String(conn.requester._id) === auth.user.id) setConnectionStatus("pending_sent");
          else {
            setConnectionStatus("pending_received");
            setConnectionId(conn._id);
          }
        } else {
          setConnectionStatus("none");
        }
      }).catch(console.error);
    }
  }, [targetId, isOwner, auth.user.id]);

  const isClientViewingFreelancer = profile && auth.user.role === "client" && profile.role === "freelancer" && !isOwner;

  useEffect(() => {
    if (isClientViewingFreelancer) {
      api.get("/jobs").then(r => {
        const myJobs = r.data.filter(j => (j.client._id === auth.user.id) || (j.client === auth.user.id));
        setClientJobs(myJobs);
        if (myJobs.length > 0) setSelectedJob(myJobs[0]._id);
      }).catch(console.error);
    }
  }, [isClientViewingFreelancer, auth.user.id]);

  const addSkill = async () => {
    if (!newSkill.trim() || profile.skills.includes(newSkill)) return;
    const updatedSkills = [...profile.skills, newSkill.trim()];
    try {
      await api.put("/users/profile", { skills: updatedSkills });
      setProfile({ ...profile, skills: updatedSkills });
      setNewSkill("");
    } catch (error) {
      console.error(error);
    }
  };

  const removeSkill = async (skill) => {
    const updatedSkills = profile.skills.filter(s => s !== skill);
    try {
      await api.put("/users/profile", { skills: updatedSkills });
      setProfile({ ...profile, skills: updatedSkills });
    } catch (error) {
      console.error(error);
    }
  };

  const inviteToJob = async () => {
    if (!selectedJob) return;
    try {
      await api.post(`/jobs/${selectedJob}/invite`, { freelancerId: profile._id });
      alert("Invitation sent!");
    } catch (error) {
      console.error(error);
      alert("Failed to send invitation.");
    }
  };

  const handleConnect = async () => {
    await api.post("/connections/request", { recipientId: targetId });
    setConnectionStatus("pending_sent");
  };
  
  const handleAccept = async () => {
    await api.put(`/connections/${connectionId}/accept`);
    setConnectionStatus("connected");
  };

  if (!profile) return <div>Loading Profile...</div>;

  return (
    <div className="page-container profile-page">
      <div className="profile-header glass-panel">
        <div className="cover-photo" style={{ backgroundImage: `url(${profile.coverImage ? getImageUrl(profile.coverImage) : 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=2000'})` }}>
          {isOwner && (
            <button className="edit-cover-btn" onClick={() => document.getElementById('cover-upload').click()}>
              📷 Edit Banner
            </button>
          )}
          <input type="file" id="cover-upload" hidden onChange={handleCoverChange} accept="image/*" />
        </div>
        <div className="profile-top-content">
          <div className="profile-avatar-row">
            <div className="avatar-container">
              <img 
                src={getAvatarUrl(profile.avatar, profile.name)} 
                alt="Avatar" 
                className="profile-avatar-large" 
                style={{ cursor: isOwner ? "pointer" : "default", opacity: uploadingAvatar ? 0.5 : 1 }}
                onClick={() => isOwner && document.getElementById('avatar-upload').click()}
              />
              {isOwner && (
                <input 
                  type="file" 
                  id="avatar-upload" 
                  accept="image/*" 
                  style={{ display: "none" }} 
                  onChange={handleAvatarChange} 
                />
              )}
            </div>
          </div>
          <div className="profile-info-main">
            <div className="profile-title-row">
              <h1>{profile.name} <span className="badge-role">{profile.role}</span></h1>
              {!isOwner && (
                <div className="profile-actions">
                  {connectionStatus === "none" && <button className="btn-primary" onClick={handleConnect}>Connect</button>}
                  {connectionStatus === "pending_sent" && <button className="btn-secondary" disabled>Pending</button>}
                  {connectionStatus === "pending_received" && <button className="btn-primary" onClick={handleAccept}>Accept Request</button>}
                  {connectionStatus === "connected" && <button className="btn-secondary" disabled>Connected</button>}
                </div>
              )}
            </div>
            <p className="bio">{profile.bio || "No professional bio available."}</p>
          </div>
        </div>
      </div>
      
      <div className="profile-body grid-2">
        <div className="section glass-panel">
          <h3>Skills</h3>
          <div className="tags">
            {profile.skills?.length ? profile.skills.map(s => (
              <span key={s} className="tag">
                {s} 
                {isOwner && <button onClick={() => removeSkill(s)} style={{ marginLeft: "5px", background: "none", border: "none", color: "inherit", cursor: "pointer" }}>&times;</button>}
              </span>
            )) : <span className="muted">None listed</span>}
          </div>
          {isOwner && (
            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <input 
                type="text" 
                value={newSkill} 
                onChange={(e) => setNewSkill(e.target.value)} 
                placeholder="Add a new skill" 
                style={{ padding: "0.5rem", borderRadius: "4px", border: "1px solid #ccc", background: "transparent", color: "white" }}
              />
              <button className="btn-primary" onClick={addSkill}>Add</button>
            </div>
          )}
        </div>
        
        <div className="section glass-panel">
          <h3>Experience</h3>
          {profile.experience?.length ? profile.experience.map(e => (
            <div key={e._id} className="exp-item">
              <h4>{e.title} at {e.company}</h4>
              <p>{e.description}</p>
            </div>
          )) : <p className="muted">No professional experience listed.</p>}
        </div>

        <div className="section glass-panel">
          <h3>Endorsements</h3>
          {profile.endorsements?.length ? profile.endorsements.map(e => (
            <div key={e._id} className="endorsement-item">
              <b>{e.endorser?.name}:</b> {e.comment} <span className="muted">({e.skill})</span>
            </div>
          )) : <p className="muted">No endorsements yet.</p>}
        </div>

        <div className="section glass-panel" style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
          <h3>Visual Portfolio</h3>
          {works.length === 0 ? <p className="muted">No work posted yet.</p> : (
            <div className="portfolio-grid grid-3" style={{ gap: "10px", marginTop: "1rem" }}>
              {works.map(w => (
                <div key={w._id} className="work-card" style={{ aspectRatio: "1", overflow: "hidden", borderRadius: "8px", position: "relative" }}>
                  {w.mediaUrls && w.mediaUrls[0] ? (
                    <img src={getImageUrl(w.mediaUrls[0])} alt="Work" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ padding: "1rem", background: "rgba(255,255,255,0.05)", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <p style={{ textAlign: "center", fontSize: "0.9rem" }}>{w.caption?.substring(0, 80)}...</p>
                    </div>
                  )}
                  <div className="work-overlay" style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.6)", padding: "0.5rem", color: "white", fontSize: "0.8rem", display: "flex", justifyContent: "space-between" }}>
                    <span>❤️ {w.likes?.length || 0}</span>
                    <span>💬 {w.comments?.length || 0}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Gigs Section ─────────────────────────────────────── */}
        {(profile.role === "freelancer") && (
          <div className="section glass-panel" style={{ gridColumn: "1 / -1", marginTop: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ margin: 0 }}>🛒 Gigs / Services</h3>
              {isOwner && (
                <button className="btn-primary" onClick={() => navigate("/gigs/create")} style={{ fontSize: "0.85rem", padding: "0.4rem 1rem" }}>
                  + Create Gig
                </button>
              )}
            </div>
            {gigs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem 0" }}>
                <p className="muted">No gigs posted yet.</p>
                {isOwner && (
                  <button className="btn-primary" onClick={() => navigate("/gigs/create")} style={{ marginTop: "0.5rem" }}>
                    Create your first gig
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                {gigs.map(g => <GigCard key={g._id} gig={g} />)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
