import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { getImageUrl, getAvatarUrl } from "../utils/image";

export default function Feed() {
  const { auth } = useAuth();
  const [feedItems, setFeedItems] = useState([]);
  const [newPostText, setNewPostText] = useState("");
  const [newPostMedia, setNewPostMedia] = useState(null);
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState({});
  const [commentText, setCommentText] = useState({});

  useEffect(() => {
    api.get("/works").then(wRes => {
      const wk = wRes.data.map(w => ({ ...w, feedType: "work" }));
      const sorted = wk.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setFeedItems(sorted);
    }).catch(console.error);
  }, []);

  const handleCreatePost = async () => {
    setPosting(true);
    try {
      const formData = new FormData();
      formData.append("title", "Post");
      formData.append("caption", newPostText);
      formData.append("description", newPostText);
      if (newPostMedia) {
        for (let i = 0; i < newPostMedia.length; i++) {
          formData.append("media", newPostMedia[i]);
        }
      }
      const { data } = await api.post("/works", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setFeedItems(prev => [{ ...data, feedType: "work" }, ...prev]);
      setNewPostText("");
      setNewPostMedia(null);
    } catch (e) {
      console.error(e);
      alert("Failed to create post.");
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (workId) => {
    try {
      await api.post(`/works/${workId}/like`);
      setFeedItems(prev => prev.map(item => {
        if (item._id === workId) {
           const hasLiked = item.likes.some(u => String(u._id || u) === auth.user.id);
           const newLikes = hasLiked 
             ? item.likes.filter(u => String(u._id || u) !== auth.user.id)
             : [...item.likes, { _id: auth.user.id, name: auth.user.name }];
           return { ...item, likes: newLikes };
        }
        return item;
      }));
    } catch (e) { console.error(e); }
  };

  const toggleComments = (workId) => {
    setOpenComments(prev => ({ ...prev, [workId]: !prev[workId] }));
  };

  const handleCommentSubmit = async (e, workId) => {
    e.preventDefault();
    const txt = commentText[workId];
    if (!txt) return;
    try {
      await api.post(`/works/${workId}/comment`, { text: txt });
      const newComment = { _id: Date.now(), user: auth.user, text: txt, createdAt: new Date() };
      setFeedItems(prev => prev.map(item => {
        if (item._id === workId) {
          return { ...item, comments: [...(item.comments || []), newComment] };
        }
        return item;
      }));
      setCommentText(prev => ({ ...prev, [workId]: "" }));
    } catch (e) { console.error(e); }
  };

  return (
    <div className="page-container" style={{ display: "flex", justifyContent: "center" }}>
      <div className="feed-layout" style={{ maxWidth: "600px", width: "100%", display: "flex", flexDirection: "column", gap: "2rem" }}>
        
        {auth.user?.role === "freelancer" && (
          <div className="feed-card glass-panel flex-col" style={{ padding: "1rem", overflow: "visible" }}>
            <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <img src={getAvatarUrl(auth.user.avatar, auth.user.name)} alt="Avatar" className="avatar" />
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
                <textarea 
                  placeholder="Start a post..." 
                  value={newPostText} 
                  onChange={(e) => setNewPostText(e.target.value)}
                  style={{ width: "100%", background: "rgba(0,0,0,0.2)", color: "white", padding: "10px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.1)", resize: "none" }}
                  rows={3}
                />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                  <input type="file" multiple accept="image/*,video/*" onChange={e => setNewPostMedia(e.target.files)} style={{ fontSize: "0.8rem", width: "auto" }} />
                  <button className="btn-primary" onClick={handleCreatePost} disabled={posting || (!newPostText && !newPostMedia)}>
                    {posting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {feedItems.map(item => {
          const w = item;
          return (
            <div key={`w-${w._id}`} className="feed-card glass-panel flex-col" style={{ padding: 0, overflow: "hidden" }}>
              <div className="card-header" style={{ padding: "1rem" }}>
                <Link to={`/profile/${w.freelancer?._id}`} style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", color: "inherit" }}>
                  <img src={getAvatarUrl(w.freelancer?.avatar, w.freelancer?.name)} alt="Avatar" className="avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }} />
                  <div><b>{w.freelancer?.name}</b> <span className="muted" style={{ fontSize: "0.8rem", marginLeft: "5px" }}>• Freelancer</span></div>
                </Link>
              </div>
              {w.mediaUrls && w.mediaUrls.length > 0 ? (
                <img src={getImageUrl(w.mediaUrls[0])} alt="Work" style={{ width: "100%", maxHeight: "500px", objectFit: "cover" }} />
              ) : (
                <div style={{ padding: "2rem", background: "rgba(255,255,255,0.05)", textAlign: "center" }}>
                  <h3>{w.title}</h3>
                  <p>{w.description}</p>
                </div>
              )}
              <div className="card-body flex-col" style={{ padding: "1rem" }}>
                <p><Link to={`/profile/${w.freelancer?._id}`} style={{ textDecoration: "none", color: "inherit" }}><b>{w.freelancer?.name}</b></Link> {w.caption || w.description}</p>
                <div className="engagement-bar" style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                  <button 
                    onClick={() => handleLike(w._id)} 
                    className="btn-icon" 
                    style={{ background: "none", border: "none", color: w.likes?.some(l => String(l._id || l) === auth.user.id) ? "#ef4444" : "white", fontSize: "1.2rem", cursor: "pointer" }}>
                    ❤️ {w.likes?.length || 0}
                  </button>
                  <button 
                    onClick={() => toggleComments(w._id)} 
                    className="btn-icon" style={{ background: "none", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer" }}>
                    💬 {w.comments?.length || 0}
                  </button>
                </div>
                
                {openComments[w._id] && (
                  <div className="comments-section" style={{ marginTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "10px" }}>
                    {w.comments?.map(c => (
                      <div key={c._id} style={{ display: "flex", gap: "10px", fontSize: "0.85rem", background: "rgba(255,255,255,0.05)", padding: "10px", borderRadius: "8px" }}>
                        <img src={getAvatarUrl(c.user?.avatar, c.user?.name)} alt="Avatar" style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover" }} />
                        <div>
                          <span style={{ fontWeight: "bold" }}>{c.user?.name}</span> <span className="muted">{c.text}</span>
                        </div>
                      </div>
                    ))}
                    <form onSubmit={(e) => handleCommentSubmit(e, w._id)} style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                      <input 
                        type="text" 
                        value={commentText[w._id] || ""} 
                        onChange={(e) => setCommentText(prev => ({ ...prev, [w._id]: e.target.value }))}
                        placeholder="Add a comment..." 
                        style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #333", background: "rgba(0,0,0,0.2)", color: "white" }} 
                      />
                      <button className="btn-primary" style={{ padding: "8px 16px", fontSize: "0.8rem" }}>Post</button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
