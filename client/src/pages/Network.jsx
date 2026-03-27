import { useEffect, useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getImageUrl, getAvatarUrl } from "../utils/image";

export default function Network() {
  const { auth } = useAuth();
  const [connections, setConnections] = useState([]);
  const [discover, setDiscover] = useState([]);

  useEffect(() => {
    fetchNetwork();
  }, []);

  const fetchNetwork = async () => {
    try {
      const [connRes, discRes] = await Promise.all([
        api.get("/connections/mine"),
        api.get("/connections/discover")
      ]);
      setConnections(connRes.data);
      setDiscover(discRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const pendingRequests = connections.filter(c => c.status === "pending" && String(c.recipient._id) === String(auth.user.id));
  const sentRequests = connections.filter(c => c.status === "pending" && String(c.requester._id) === String(auth.user.id));
  const myConnections = connections.filter(c => c.status === "accepted");

  const acceptRequest = async (id) => {
    try {
      await api.put(`/connections/${id}/accept`);
      fetchNetwork();
    } catch (error) {
      console.error(error);
    }
  };

  const sendRequest = async (userId) => {
    try {
      await api.post("/connections/request", { recipientId: userId });
      alert("Request sent!");
      fetchNetwork();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="page-container network-page">
      <h1>My Network</h1>

      {pendingRequests.length > 0 && (
        <div className="section glass-panel" style={{ marginBottom: "2rem" }}>
          <h2>Received Connection Requests</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
            {pendingRequests.map(r => (
              <div key={r._id} className="user-card" style={{ padding: "1rem", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px" }}>
                <h4 style={{ margin: "0 0 4px", fontSize: "1rem" }}>{r.requester.name}</h4>
                <p className="muted" style={{ fontSize: "0.85rem", margin: 0 }}>{r.requester.role} • {r.requester.skills?.slice(0, 3).join(", ")}</p>
                <div style={{ marginTop: "1rem", display: "flex", gap: "10px", alignItems: "center" }}>
                  <button className="btn-primary" onClick={() => acceptRequest(r._id)} style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>Accept</button>
                  <Link to={`/profile/${r.requester._id}`} className="btn-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}>Profile</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sentRequests.length > 0 && (
        <div className="section glass-panel" style={{ marginBottom: "2rem" }}>
          <h2>Sent Requests</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" }}>
            {sentRequests.map(r => (
              <div key={r._id} className="user-card" style={{ padding: "0.75rem", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                <h4 style={{ margin: "0 0 4px", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{r.recipient.name}</h4>
                <p className="muted" style={{ fontSize: "0.75rem", margin: 0 }}>Pending</p>
                <Link to={`/profile/${r.recipient._id}`} className="btn-secondary" style={{ marginTop: "auto", padding: "0.3rem 0.6rem", fontSize: "0.75rem", width: "100%", boxSizing: "border-box", display: "block" }}>Profile</Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="section glass-panel" style={{ marginBottom: "2rem" }}>
        <h2>My Connections ({myConnections.length})</h2>
        {myConnections.length === 0 ? <p className="muted">No connections yet.</p> : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem" }}>
            {myConnections.map(c => {
              const other = String(c.requester._id) === String(auth.user.id) ? c.recipient : c.requester;
              return (
                <div key={c._id} className="user-card" style={{ padding: "1rem", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <img src={getAvatarUrl(other.avatar, other.name)} alt="Avatar" style={{ width: "48px", height: "48px", borderRadius: "50%", marginBottom: "0.5rem", objectFit: "cover" }} />
                  <h4 style={{ margin: "0 0 4px", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{other.name}</h4>
                  <p className="muted" style={{ fontSize: "0.75rem", margin: 0 }}>{other.role}</p>
                  <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "0.75rem", width: "100%" }}>
                    <Link to={`/messages/${other._id}`} className="btn-secondary" style={{ padding: "0.3rem", fontSize: "0.75rem", flex: 1, textAlign: "center", boxSizing: "border-box" }}>Message</Link>
                    <Link to={`/profile/${other._id}`} className="btn-primary" style={{ padding: "0.3rem", fontSize: "0.75rem", flex: 1, textAlign: "center", boxSizing: "border-box" }}>Profile</Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="section glass-panel">
        <h2>Discover More Professionals</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "1rem", marginTop: "1rem" }}>
          {discover.map(u => (
            <div key={u._id} className="user-card" style={{ padding: "1rem", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <img src={getAvatarUrl(u.avatar, u.name)} alt="Avatar" style={{ width: "48px", height: "48px", borderRadius: "50%", marginBottom: "0.5rem", objectFit: "cover" }} />
              <h4 style={{ margin: "0 0 4px", fontSize: "0.9rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>{u.name}</h4>
              <p className="muted" style={{ fontSize: "0.75rem", margin: 0 }}>{u.role}</p>
              <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginTop: "0.75rem", width: "100%" }}>
                <button className="btn-primary" onClick={() => sendRequest(u._id)} style={{ padding: "0.3rem", fontSize: "0.75rem", flex: 1, boxSizing: "border-box" }}>Connect</button>
                <Link to={`/profile/${u._id}`} className="btn-secondary" style={{ padding: "0.3rem", fontSize: "0.75rem", flex: 1, textAlign: "center", boxSizing: "border-box" }}>View</Link>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
