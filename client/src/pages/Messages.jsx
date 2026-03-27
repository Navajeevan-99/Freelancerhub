import { useEffect, useState } from "react";
import api from "../api";
import { socket } from "../socket";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getImageUrl, getAvatarUrl } from "../utils/image";

export default function Messages() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { auth } = useAuth();
  
  const [conversations, setConversations] = useState([]);
  const [activePartnerId, setActivePartnerId] = useState(id || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      const { data } = await api.get("/messages/conversations");
      
      let finalConversations = [...data];
      if (activePartnerId) {
        const found = data.some(c => String(c.user._id) === activePartnerId);
        if (!found) {
          try {
            const userRes = await api.get(`/users/${activePartnerId}`);
            finalConversations.unshift({ user: userRes.data, lastMessage: null });
          } catch (e) {
            console.error("Failed to fetch target user", e);
          }
        }
      }

      setConversations(finalConversations);
      if (!activePartnerId && finalConversations.length > 0) {
        setActivePartnerId(finalConversations[0].user._id);
        navigate(`/messages/${finalConversations[0].user._id}`, { replace: true });
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (activePartnerId) {
      api.get(`/messages/${activePartnerId}`).then(r => setMessages(r.data)).catch(console.error);
    }
  }, [activePartnerId]);

  useEffect(() => {
    const handler = (msg) => {
      // If the incoming message belongs to the current open conversation
      if (
        (msg.from._id === activePartnerId && msg.to === auth.user.id) ||
        (msg.from._id === auth.user.id && msg.to === activePartnerId)
      ) {
        setMessages(prev => [...prev, msg]);
      } else {
        // Refresh conversations if a new message comes from someone else
        fetchConversations();
      }
    };
    socket.on("newDirectMessage", handler);
    return () => socket.off("newDirectMessage", handler);
  }, [activePartnerId, auth.user.id]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activePartnerId) return;
    try {
      const { data } = await api.post(`/messages/${activePartnerId}`, { text });
      setMessages(prev => [...prev, data]);
      setText("");
      fetchConversations(); // to update last message snippet
    } catch (error) {
      console.error(error);
    }
  };

  const handleSelectConversation = (partnerId) => {
    setActivePartnerId(partnerId);
    navigate(`/messages/${partnerId}`);
  };

  const activePartner = conversations.find(c => String(c.user._id) === activePartnerId)?.user;

  return (
    <div className="page-container workspace-layout">
      <div className="sidebar glass-panel flex-col">
        <h3>Conversations</h3>
        {conversations.length === 0 ? <p className="muted" style={{ padding: "1rem" }}>No messages yet.</p> : null}
        {conversations.map(c => (
          <div 
            key={c.user._id} 
            className={`nav-item ${activePartnerId === String(c.user._id) ? "active" : ""}`} 
            onClick={() => handleSelectConversation(c.user._id)}
            style={{ display: "flex", alignItems: "center", gap: "10px" }}
          >
            <img src={getAvatarUrl(c.user.avatar, c.user.name)} alt="Avatar" style={{ width: "30px", height: "30px", borderRadius: "50%" }} />
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{c.user.name}</div>
              <div className="muted" style={{ fontSize: "0.8rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {c.lastMessage?.text}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="workspace-main" style={{ display: "flex", flex: 1, gap: "1rem", overflow: "hidden" }}>
        {activePartnerId && activePartner ? (
          <div className="chat-area glass-panel flex-col" style={{ flex: 1 }}>
            <div className="project-header" style={{ padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: "10px" }}>
              <img src={getAvatarUrl(activePartner.avatar, activePartner.name)} alt="Avatar" style={{ width: "40px", height: "40px", borderRadius: "50%" }} />
              <div>
                <h3 style={{ margin: 0 }}><Link to={`/profile/${activePartner._id}`} style={{ color: "inherit", textDecoration: "none" }}>{activePartner.name}</Link></h3>
                <span className="muted" style={{ fontSize: "0.8rem" }}>{activePartner.role}</span>
              </div>
            </div>

            <div className="chat-messages flex-col" style={{ flex: 1, overflowY: "auto", padding: "1rem" }}>
              {messages.length === 0 ? <p className="muted text-center" style={{ width: "100%", textAlign: "center" }}>Start of conversation</p> : null}
              {messages.map(m => (
                <div key={m._id} className="chat-bubble" style={{ 
                  marginBottom: "10px", 
                  padding: "10px", 
                  borderRadius: "8px",
                  background: m.from?._id === auth.user.id ? "rgba(0, 240, 255, 0.1)" : "rgba(255,255,255,0.05)",
                  alignSelf: m.from?._id === auth.user.id ? "flex-end" : "flex-start",
                  maxWidth: "80%"
                }}>
                  <div style={{ fontSize: "0.75rem", color: "#aaa", marginBottom: "4px" }}>{m.from?.name}</div>
                  <div>{m.text}</div>
                </div>
              ))}
            </div>
            <form onSubmit={send} className="chat-input-row" style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "0.5rem" }}>
              <input value={text} onChange={e => setText(e.target.value)} placeholder={`Message ${activePartner.name}...`} style={{ flex: 1, padding: "0.8rem", borderRadius: "4px", border: "1px solid #333", background: "rgba(0,0,0,0.2)", color: "white" }} />
              <button className="btn-primary" style={{ padding: "0.8rem 1.5rem" }}>Send</button>
            </form>
          </div>
        ) : (
          <div className="glass-panel flex-col" style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <p className="muted">Select a conversation from the sidebar.</p>
          </div>
        )}
      </div>
    </div>
  );
}
