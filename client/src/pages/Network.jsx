import { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAvatarUrl } from "../utils/image";

function UserCard({ user, actions }) {
  return (
    <div className="network-user-card">
      <img
        src={getAvatarUrl(user.avatar, user.name)}
        alt={user.name}
        className="network-avatar"
      />
      <div style={{ fontWeight: 700, fontSize: "0.92rem", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
        {user.name}
      </div>
      <span className={`network-role-badge ${user.role}`}>{user.role}</span>
      {user.skills?.length > 0 && (
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", width: "100%" }}>
          {user.skills.slice(0, 3).join(" · ")}
        </div>
      )}
      <div style={{ display: "flex", gap: "6px", marginTop: "8px", width: "100%" }}>
        {actions}
      </div>
    </div>
  );
}

export default function Network() {
  const { auth } = useAuth();
  const [connections, setConnections] = useState([]);
  const [discover, setDiscover] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState({});

  useEffect(() => { fetchNetwork(); }, []);

  const fetchNetwork = async () => {
    setLoading(true);
    try {
      const [connRes, discRes] = await Promise.all([
        api.get("/connections/mine"),
        api.get("/connections/discover"),
      ]);
      setConnections(connRes.data);
      setDiscover(discRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = connections.filter(c => c.status === "pending" && String(c.recipient._id) === String(auth.user.id));
  const sentRequests    = connections.filter(c => c.status === "pending" && String(c.requester._id) === String(auth.user.id));
  const myConnections   = connections.filter(c => c.status === "accepted");

  const acceptRequest = async (id) => {
    try { await api.put(`/connections/${id}/accept`); fetchNetwork(); }
    catch (e) { console.error(e); }
  };

  const sendRequest = async (userId) => {
    setSending(p => ({ ...p, [userId]: true }));
    try {
      await api.post("/connections/request", { recipientId: userId });
      fetchNetwork();
    } catch (e) {
      alert(e?.response?.data?.message || "Could not send request");
    } finally {
      setSending(p => ({ ...p, [userId]: false }));
    }
  };

  if (loading) return (
    <div className="page-container">
      <h1 style={{ fontWeight: 800 }}>My Network</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="network-user-card" style={{ gap: "0.75rem" }}>
            <div className="skeleton" style={{ width: 64, height: 64, borderRadius: "50%" }} />
            <div className="skeleton" style={{ width: "80%", height: 14 }} />
            <div className="skeleton" style={{ width: "50%", height: 12 }} />
            <div className="skeleton" style={{ width: "100%", height: 30, borderRadius: 8 }} />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* Page header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ fontWeight: 800, fontSize: "1.75rem" }}>My Network</h1>
          <p className="muted" style={{ fontSize: "0.9rem", marginTop: "4px" }}>
            {myConnections.length} connection{myConnections.length !== 1 ? "s" : ""}
            {pendingRequests.length > 0 && <span style={{ marginLeft: "12px", color: "var(--warning)" }}>· {pendingRequests.length} pending request{pendingRequests.length !== 1 ? "s" : ""}</span>}
          </p>
        </div>
      </div>

      {/* Incoming requests */}
      {pendingRequests.length > 0 && (
        <div className="glass-panel" style={{ borderLeft: "3px solid var(--warning)" }}>
          <div className="section-header">
            <h3>
              📬 Connection Requests
              <span className="section-counter" style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.25)", marginLeft: 8 }}>
                {pendingRequests.length}
              </span>
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "1rem" }}>
            {pendingRequests.map(r => (
              <UserCard
                key={r._id}
                user={{ ...r.requester, role: r.requester.role }}
                actions={<>
                  <button
                    className="btn-primary"
                    onClick={() => acceptRequest(r._id)}
                    style={{ flex: 1, fontSize: "0.8rem", padding: "6px 8px" }}
                  >✓ Accept</button>
                  <Link to={`/profile/${r.requester._id}`} className="btn-secondary" style={{ flex: 1, fontSize: "0.8rem", padding: "6px 8px", textAlign: "center" }}>View</Link>
                </>}
              />
            ))}
          </div>
        </div>
      )}

      {/* Sent requests */}
      {sentRequests.length > 0 && (
        <div className="glass-panel">
          <div className="section-header">
            <h3>
              📤 Sent Requests
              <span className="section-counter" style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)", marginLeft: 8 }}>
                {sentRequests.length}
              </span>
            </h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "0.75rem" }}>
            {sentRequests.map(r => (
              <UserCard
                key={r._id}
                user={r.recipient}
                actions={<>
                  <span style={{ flex: 1, textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)", padding: "6px", background: "rgba(255,255,255,0.04)", borderRadius: 6, border: "1px solid var(--glass-border)" }}>⏳ Pending</span>
                  <Link to={`/profile/${r.recipient._id}`} className="btn-secondary" style={{ flex: 1, fontSize: "0.75rem", padding: "6px 8px", textAlign: "center" }}>View</Link>
                </>}
              />
            ))}
          </div>
        </div>
      )}

      {/* My Connections */}
      <div className="glass-panel">
        <div className="section-header">
          <h3>
            🤝 My Connections
            <span className="section-counter" style={{ background: "rgba(16,185,129,0.12)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)", marginLeft: 8 }}>
              {myConnections.length}
            </span>
          </h3>
        </div>
        {myConnections.length === 0 ? (
          <div className="empty-state" style={{ padding: "2.5rem 1rem" }}>
            <div className="empty-state-icon">🤝</div>
            <h3>No connections yet</h3>
            <p>Start connecting with talented professionals below.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
            {myConnections.map(c => {
              const other = String(c.requester._id) === String(auth.user.id) ? c.recipient : c.requester;
              return (
                <UserCard
                  key={c._id}
                  user={other}
                  actions={<>
                    <Link to={`/messages/${other._id}`} className="btn-secondary" style={{ flex: 1, fontSize: "0.75rem", padding: "6px 4px", textAlign: "center" }}>💬 Message</Link>
                    <Link to={`/profile/${other._id}`} className="btn-primary" style={{ flex: 1, fontSize: "0.75rem", padding: "6px 4px", textAlign: "center" }}>Profile</Link>
                  </>}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Discover */}
      <div className="glass-panel">
        <div className="section-header">
          <h3>🌐 Discover Professionals</h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>{discover.length} suggested</span>
        </div>
        {discover.length === 0 ? (
          <div className="empty-state" style={{ padding: "2rem" }}>
            <div className="empty-state-icon">🔍</div>
            <h3>No more suggestions</h3>
            <p>You've connected with everyone in your network!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
            {discover.map(u => (
              <UserCard
                key={u._id}
                user={u}
                actions={<>
                  <button
                    className="btn-primary"
                    onClick={() => sendRequest(u._id)}
                    disabled={sending[u._id]}
                    style={{ flex: 1, fontSize: "0.75rem", padding: "6px 4px" }}
                  >
                    {sending[u._id] ? "..." : "+ Connect"}
                  </button>
                  <Link to={`/profile/${u._id}`} className="btn-secondary" style={{ flex: 1, fontSize: "0.75rem", padding: "6px 4px", textAlign: "center" }}>View</Link>
                </>}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
