import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { socket } from "../socket";
import { getImageUrl, getAvatarUrl } from "../utils/image";

const STATUS_CONFIG = {
  pending:              { label: "Pending",             color: "#f59e0b", icon: "⏳" },
  accepted:             { label: "Accepted",            color: "#3b82f6", icon: "✅" },
  rejected:             { label: "Rejected",            color: "#ef4444", icon: "❌" },
  in_progress:          { label: "In Progress",         color: "#8b5cf6", icon: "🔨" },
  delivered:            { label: "Delivered",           color: "#06b6d4", icon: "📦" },
  completed:            { label: "Completed",           color: "#10b981", icon: "🎉" },
  cancelled:            { label: "Cancelled",           color: "#6b7280", icon: "🚫" },
  requirements_pending: { label: "Needs Requirements",  color: "#f59e0b", icon: "📝" },
};

export default function Dashboard() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const isFreelancer = auth.user?.role === "freelancer";

  const [orders, setOrders] = useState([]);
  const [gigs, setGigs] = useState([]);
  const [stats, setStats] = useState({ active: 0, completed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      if (isFreelancer) {
        const [ordersR, gigsR] = await Promise.all([
          api.get("/orders/requests"),
          api.get(`/gigs/freelancer/${auth.user.id}`),
        ]);
        setOrders(ordersR.data);
        setGigs(gigsR.data);
        setStats({
          pending:   ordersR.data.filter(o => o.status === "pending").length,
          active:    ordersR.data.filter(o => o.status === "in_progress" || o.status === "delivered").length,
          completed: ordersR.data.filter(o => o.status === "completed").length,
        });
      } else {
        const r = await api.get("/orders/mine");
        setOrders(r.data);
        setStats({
          pending:   r.data.filter(o => o.status === "pending").length,
          active:    r.data.filter(o => ["accepted","in_progress","delivered"].includes(o.status)).length,
          completed: r.data.filter(o => o.status === "completed").length,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [auth.user]);

  // Live refresh on notification
  useEffect(() => {
    const refresh = () => load();
    socket.on("orderAccepted", refresh);
    socket.on("newNotification", refresh);
    return () => { socket.off("orderAccepted", refresh); socket.off("newNotification", refresh); };
  }, []);

  const respond = async (orderId, action) => {
    setResponding(p => ({ ...p, [orderId]: true }));
    try {
      await api.put(`/orders/${orderId}/respond`, { action });
      load();
    } catch (e) { alert(e?.response?.data?.message || "Error"); }
    finally { setResponding(p => ({ ...p, [orderId]: false })); }
  };

  const deliver = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/deliver`);
      load();
    } catch (e) { alert(e?.response?.data?.message || "Error"); }
  };

  const complete = async (orderId) => {
    if (!window.confirm("Mark this order as complete?")) return;
    try {
      await api.put(`/orders/${orderId}/complete`);
      load();
    } catch (e) { alert(e?.response?.data?.message || "Error"); }
  };

  // ── Stat card ─────────────────────────────────────────────────────────────
  const StatCard = ({ icon, label, value, color }) => (
    <div className="glass-panel" style={{ padding: "1.5rem", textAlign: "center", borderTop: `3px solid ${color}`, background: `linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%), var(--glass-bg)`, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "-20px", right: "-20px", fontSize: "6rem", opacity: 0.05, transform: "rotate(15deg)" }}>{icon}</div>
      <div style={{ fontSize: "2.2rem", filter: `drop-shadow(0 0 10px ${color}40)`, marginBottom: "0.5rem" }}>{icon}</div>
      <div style={{ fontSize: "2.5rem", fontWeight: 800, color, marginTop: "0.25rem", lineHeight: 1 }}>{value}</div>
      <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "0.5rem", fontWeight: 500, textTransform: "uppercase", letterSpacing: "1px" }}>{label}</div>
    </div>
  );

  // ── Order card ────────────────────────────────────────────────────────────
  const OrderCard = ({ order }) => {
    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const thumb = order.gig?.gallery?.[0];
    const otherUser = isFreelancer ? order.client : order.freelancer;
    return (
      <div className="glass-panel" style={{ padding: "1.2rem", borderRadius: "14px", display: "flex", flexDirection: "column", gap: "0.75rem", border: `1px solid ${cfg.color}33` }}>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
          {thumb ? (
            <img src={getImageUrl(thumb)} alt="gig" style={{ width: "52px", height: "52px", borderRadius: "8px", objectFit: "cover", flexShrink: 0 }} />
          ) : (
            <div style={{ width: "52px", height: "52px", borderRadius: "8px", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", flexShrink: 0 }}>🛒</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{order.gig?.title || "Gig"}</div>
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "2px", textTransform: "capitalize" }}>
              {order.selectedPackage} · ${order.packageSnapshot?.price}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <img src={getAvatarUrl(otherUser?.avatar, otherUser?.name)} style={{ width: "18px", height: "18px", borderRadius: "50%" }} alt="" />
              <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{otherUser?.name}</span>
            </div>
          </div>
          <span style={{ background: `${cfg.color}22`, color: cfg.color, border: `1px solid ${cfg.color}44`, padding: "2px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>
            {cfg.icon} {cfg.label}
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {/* Freelancer actions */}
          {isFreelancer && order.status === "pending" && (
            <>
              <button className="btn-primary" disabled={responding[order._id]} onClick={() => respond(order._id, "accept")} style={{ flex: 1, background: "#10b981", fontSize: "0.82rem", padding: "0.5rem" }}>
                {responding[order._id] ? "..." : "✅ Accept"}
              </button>
              <button disabled={responding[order._id]} onClick={() => respond(order._id, "reject")} style={{ flex: 1, background: "transparent", border: "1px solid #ef4444", color: "#ef4444", borderRadius: "8px", cursor: "pointer", fontWeight: 600, fontSize: "0.82rem", padding: "0.5rem" }}>
                ❌ Reject
              </button>
            </>
          )}
          {isFreelancer && order.status === "in_progress" && (
            <button className="btn-primary" onClick={() => deliver(order._id)} style={{ flex: 1, fontSize: "0.82rem", padding: "0.5rem" }}>
              📦 Mark Delivered
            </button>
          )}

          {/* Client actions */}
          {!isFreelancer && order.status === "accepted" && (
            <button className="btn-primary" onClick={() => navigate(`/orders/${order._id}/requirements`)} style={{ flex: 1, fontSize: "0.82rem", padding: "0.5rem", background: "#f59e0b" }}>
              📝 Submit Requirements
            </button>
          )}
          {!isFreelancer && order.status === "delivered" && (
            <button className="btn-primary" onClick={() => complete(order._id)} style={{ flex: 1, fontSize: "0.82rem", padding: "0.5rem", background: "#10b981" }}>
              🎉 Accept & Complete
            </button>
          )}

          {/* Workspace link for active orders */}
          {order.project && ["in_progress","delivered","completed"].includes(order.status) && (
            <Link to={`/workspace/${order.project._id || order.project}`} style={{ flex: 1 }}>
              <button className="btn-secondary" style={{ width: "100%", fontSize: "0.82rem", padding: "0.5rem" }}>🔧 Open Workspace</button>
            </Link>
          )}

          {/* Re-order link for completed/cancelled orders */}
          {!isFreelancer && ["completed", "delivered", "cancelled"].includes(order.status) && order.gig && (
            <Link to={`/gigs/${order.gig._id}`} style={{ flex: 1 }}>
              <button className="btn-secondary" style={{ width: "100%", fontSize: "0.82rem", padding: "0.5rem", background: "rgba(59, 130, 246, 0.2)", color: "#3b82f6", border: "1px solid #3b82f6" }}>
                🔄 Order Again
              </button>
            </Link>
          )}
        </div>
      </div>
    );
  };

  // ── Freelancer Gig quick card ─────────────────────────────────────────────
  const GigQuickCard = ({ gig }) => (
    <Link to={`/gigs/${gig._id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="glass-panel" style={{ padding: "0.85rem", borderRadius: "12px", display: "flex", gap: "0.75rem", alignItems: "center", transition: "border-color 0.2s", border: "1px solid var(--glass-border)" }}>
        {gig.gallery?.[0] ? <img src={getImageUrl(gig.gallery[0])} style={{ width: "44px", height: "44px", borderRadius: "8px", objectFit: "cover" }} alt="" /> : <div style={{ width: "44px", height: "44px", borderRadius: "8px", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>🛒</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: "0.88rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{gig.title}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{gig.category} · ${gig.packages?.basic?.price}</div>
        </div>
        <span style={{ color: "#00f0ff", fontSize: "0.75rem", fontWeight: 700 }}>{gig.totalOrders || 0} orders</span>
      </div>
    </Link>
  );

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "var(--text-muted)" }}>⏳ Loading...</div>;

  const pendingOrders = orders.filter(o => o.status === "pending");
  const activeOrders  = orders.filter(o => ["accepted","in_progress","delivered"].includes(o.status));
  const doneOrders    = orders.filter(o => ["completed","rejected","cancelled"].includes(o.status));

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h1 style={{ margin: 0 }}>
            {isFreelancer ? "💼 Freelancer Dashboard" : "🧑‍💼 Client Dashboard"}
          </h1>
          <p style={{ color: "var(--text-muted)", margin: "4px 0 0", fontSize: "0.9rem" }}>
            Welcome back, <strong>{auth.user?.name}</strong>
          </p>
        </div>
        {isFreelancer ? (
          <button className="btn-primary" onClick={() => navigate("/gigs/create")} style={{ padding: "0.6rem 1.2rem" }}>+ Create Gig</button>
        ) : (
          <Link to="/marketplace"><button className="btn-primary" style={{ padding: "0.6rem 1.2rem" }}>🛒 Browse Marketplace</button></Link>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        <StatCard icon="⏳" label="Pending" value={stats.pending} color="#f59e0b" />
        <StatCard icon="🔨" label="Active" value={stats.active} color="#8b5cf6" />
        <StatCard icon="✅" label="Completed" value={stats.completed} color="#10b981" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isFreelancer ? "1fr 300px" : "1fr", gap: "1.5rem" }}>
        {/* ── Main orders/requests panel ─── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Pending */}
          {pendingOrders.length > 0 && (
            <div>
              <h3 style={{ marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "8px" }}>
                ⏳ {isFreelancer ? "Incoming Requests" : "Awaiting Response"}
                <span style={{ background: "#f59e0b22", color: "#f59e0b", borderRadius: "20px", padding: "2px 10px", fontSize: "0.75rem", fontWeight: 700 }}>{pendingOrders.length}</span>
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "0.85rem" }}>
                {pendingOrders.map(o => <OrderCard key={o._id} order={o} />)}
              </div>
            </div>
          )}

          {/* Active */}
          {activeOrders.length > 0 && (
            <div>
              <h3 style={{ marginBottom: "0.75rem" }}>🔨 Active Orders</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "0.85rem" }}>
                {activeOrders.map(o => <OrderCard key={o._id} order={o} />)}
              </div>
            </div>
          )}

          {/* Past */}
          {doneOrders.length > 0 && (
            <div>
              <h3 style={{ marginBottom: "0.75rem", color: "var(--text-muted)" }}>📁 Past Orders</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "0.85rem" }}>
                {doneOrders.map(o => <OrderCard key={o._id} order={o} />)}
              </div>
            </div>
          )}

          {orders.length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">{isFreelancer ? "📬" : "🛒"}</div>
              <h3 style={{ color: "var(--text-primary)" }}>{isFreelancer ? "No Requests Yet" : "Your Orders Are Empty"}</h3>
              <p style={{ maxWidth: "450px", margin: "0.5rem auto 1.5rem" }}>
                {isFreelancer ? "You haven't received any gig requests yet. Make sure your gigs are active and well-described to attract more clients!" : "You don't have any active or past orders. Browse our marketplace to find the perfect service for your next project."}
              </p>
              {isFreelancer ? (
                <button className="btn-primary" onClick={() => navigate("/gigs/create")} style={{ padding: "0.8rem 1.6rem" }}>+ Create Gig</button>
              ) : (
                <Link to="/marketplace"><button className="btn-primary" style={{ padding: "0.8rem 1.6rem" }}>🛒 Browse Marketplace</button></Link>
              )}
            </div>
          )}
        </div>

        {/* ── Freelancer gig sidebar ─── */}
        {isFreelancer && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                <h4 style={{ margin: 0 }}>🛒 My Gigs</h4>
                <Link to="/marketplace" style={{ fontSize: "0.8rem", color: "#00f0ff", textDecoration: "none" }}>View all</Link>
              </div>
              {gigs.length === 0 ? (
                <div className="empty-state" style={{ padding: "2rem 1rem", background: "transparent", border: "none" }}>
                  <div className="empty-state-icon" style={{ fontSize: "2.5rem", animationDuration: "4s" }}>🛍️</div>
                  <h4 style={{ margin: "0 0 0.25rem", fontSize: "1rem", color: "var(--text-primary)" }}>No Gigs Found</h4>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginBottom: "1.25rem" }}>Offer your services to clients.</p>
                  <button className="btn-primary" onClick={() => navigate("/gigs/create")} style={{ fontSize: "0.82rem", padding: "0.6rem 1rem", width: "100%" }}>+ Create Gig</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {gigs.slice(0, 5).map(g => <GigQuickCard key={g._id} gig={g} />)}
                  {gigs.length > 5 && (
                    <Link to={`/profile/${auth.user.id}`} style={{ textAlign: "center", fontSize: "0.8rem", color: "#00f0ff", padding: "0.5rem", textDecoration: "none" }}>
                      +{gigs.length - 5} more gigs
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Quick links */}
            <div className="glass-panel" style={{ padding: "1rem", borderRadius: "14px" }}>
              <h4 style={{ margin: "0 0 0.75rem" }}>Quick Links</h4>
              {[
                { to: "/marketplace", label: "🛒 Marketplace" },
                { to: "/feed", label: "📸 Post Portfolio" },
                { to: `/profile/${auth.user.id}`, label: "👤 My Profile" },
                { to: "/workspace", label: "🔧 Workspace" },
              ].map(({ to, label }) => (
                <Link key={to} to={to} style={{ display: "block", padding: "0.5rem 0.75rem", borderRadius: "8px", color: "var(--text-primary)", textDecoration: "none", fontSize: "0.88rem", transition: "background 0.2s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "var(--glass-border)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >{label}</Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
