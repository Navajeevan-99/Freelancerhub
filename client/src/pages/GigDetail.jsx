import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api";
import PackageCompare from "../components/PackageCompare";
import GigCard from "../components/GigCard";
import { useAuth } from "../context/AuthContext";
import { getAvatarUrl } from "../utils/image";

export default function GigDetail() {
  const { id } = useParams();
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [gig, setGig] = useState(null);
  const [related, setRelated] = useState([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [clientNote, setClientNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isOwner = gig && String(gig.freelancer?._id) === auth.user.id;

  useEffect(() => {
    setLoading(true);
    api.get(`/gigs/${id}`)
      .then(r => {
        setGig(r.data);
        setActiveImg(0);
        // Fetch related gigs
        return api.get(`/gigs?category=${r.data.category}`);
      })
      .then(r => setRelated(r.data.filter(g => g._id !== id).slice(0, 4)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Deactivate this gig?")) return;
    await api.delete(`/gigs/${id}`);
    navigate("/marketplace");
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    if (!selectedPkg) return alert("Select a package first");
    setSubmitting(true);
    try {
      await api.post("/orders", { gigId: gig._id, selectedPackage: selectedPkg, clientNote });
      setShowModal(false);
      navigate("/"); // taking them to dashboard
    } catch (err) {
      alert(err?.response?.data?.message || "Could not place request");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.5)" }}>
      <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>⏳</div>Loading gig...
    </div>
  );

  if (!gig) return (
    <div style={{ textAlign: "center", padding: "4rem" }}>
      <div style={{ fontSize: "3rem" }}>😕</div>
      <p>Gig not found. <Link to="/marketplace">Browse Marketplace</Link></p>
    </div>
  );

  const { freelancer, packages } = gig;

  return (
    <div className="page-container">
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "2rem", alignItems: "start" }}>

        {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

          {/* Breadcrumb */}
          <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", display: "flex", gap: "6px", alignItems: "center" }}>
            <Link to="/marketplace" style={{ color: "#00f0ff", textDecoration: "none" }}>Marketplace</Link>
            <span>›</span>
            <span>{gig.category}</span>
            <span>›</span>
            <span style={{ color: "rgba(255,255,255,0.7)" }}>{gig.title.slice(0, 40)}{gig.title.length > 40 ? "…" : ""}</span>
          </div>

          {/* Title */}
          <div>
            <h1 style={{ margin: "0 0 0.5rem", fontSize: "clamp(1.2rem,3vw,1.7rem)", lineHeight: 1.35 }}>{gig.title}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
              <span style={{ background: "rgba(0,240,255,0.1)", color: "#00f0ff", padding: "3px 10px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 700 }}>{gig.category}</span>
              {gig.averageRating > 0 && (
                <span style={{ color: "#facc15", fontWeight: 700, fontSize: "0.9rem" }}>
                  ★ {gig.averageRating.toFixed(1)} <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>({gig.totalReviews} reviews)</span>
                </span>
              )}
              {gig.totalOrders > 0 && <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>📦 {gig.totalOrders} orders</span>}
            </div>
          </div>

          {/* Gallery carousel */}
          {gig.gallery?.length > 0 && (
            <div>
              <div style={{ borderRadius: "14px", overflow: "hidden", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <img
                  src={gig.gallery[activeImg]}
                  alt="Gallery"
                  style={{ width: "100%", maxHeight: "420px", objectFit: "contain", display: "block" }}
                />
              </div>
              {gig.gallery.length > 1 && (
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", overflowX: "auto" }}>
                  {gig.gallery.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`thumb-${i}`}
                      onClick={() => setActiveImg(i)}
                      style={{ width: "70px", height: "70px", objectFit: "cover", borderRadius: "8px", cursor: "pointer", border: i === activeImg ? "2px solid #00f0ff" : "2px solid transparent", opacity: i === activeImg ? 1 : 0.6, transition: "all 0.2s", flexShrink: 0 }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "14px" }}>
            <h3 style={{ marginTop: 0 }}>About This Gig</h3>
            <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{gig.description}</p>
            {gig.tags?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "1rem" }}>
                {gig.tags.map(t => (
                  <span key={t} style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", padding: "3px 10px", borderRadius: "20px", fontSize: "0.78rem" }}>#{t}</span>
                ))}
              </div>
            )}
          </div>

          {/* Package comparison */}
          <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "14px" }}>
            <h3 style={{ marginTop: 0 }}>Compare Packages</h3>
            <PackageCompare packages={packages} onSelect={auth.user.role === "client" ? (pkg) => setSelectedPkg(pkg) : null} />
          </div>

          {/* Owner controls */}
          {isOwner && (
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn-secondary" onClick={() => navigate(`/gigs/${id}/edit`)} style={{ flex: 1 }}>✏️ Edit Gig</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: "0.65rem", borderRadius: "10px", border: "1px solid #ef4444", background: "transparent", color: "#ef4444", cursor: "pointer", fontWeight: 600 }}>🗑 Deactivate</button>
            </div>
          )}

          {/* Related gigs */}
          {related.length > 0 && (
            <div>
              <h3>Related Gigs</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                {related.map(g => <GigCard key={g._id} gig={g} compact />)}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ──────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", position: "sticky", top: "80px" }}>

          {/* Freelancer card */}
          <div className="glass-panel" style={{ padding: "1.5rem", borderRadius: "16px", textAlign: "center" }}>
            <Link to={`/profile/${freelancer?._id}`} style={{ textDecoration: "none", color: "inherit" }}>
              <img
                src={getAvatarUrl(freelancer?.avatar, freelancer?.name)}
                alt={freelancer?.name}
                style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(0,240,255,0.4)", marginBottom: "0.75rem" }}
              />
              <h3 style={{ margin: "0 0 0.25rem" }}>{freelancer?.name}</h3>
            </Link>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.82rem", margin: "0 0 0.75rem" }}>
              {freelancer?.bio?.slice(0, 90) || "Freelancer"}
              {freelancer?.bio?.length > 90 ? "…" : ""}
            </p>
            {freelancer?.averageRating > 0 && (
              <div style={{ color: "#facc15", marginBottom: "0.5rem", fontWeight: 700 }}>
                ★ {freelancer.averageRating.toFixed(1)}
              </div>
            )}
            {freelancer?.skills?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", justifyContent: "center", marginBottom: "1rem" }}>
                {freelancer.skills.slice(0, 4).map(s => (
                  <span key={s} style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.7)", padding: "2px 8px", borderRadius: "20px", fontSize: "0.75rem" }}>{s}</span>
                ))}
              </div>
            )}
            <Link to={`/profile/${freelancer?._id}`}>
              <button className="btn-secondary" style={{ width: "100%", marginBottom: "0.5rem" }}>View Full Profile</button>
            </Link>
          </div>

          {/* Package quick-select */}
          {auth.user.role === "client" && (
            <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "16px" }}>
              <h4 style={{ margin: "0 0 1rem", color: "rgba(255,255,255,0.8)" }}>Select a Package</h4>
              {["basic", "standard", "premium"].map(t => {
                const pkg = packages[t];
                if (!pkg) return null;
                const colors = { basic: "#64748b", standard: "#0ea5e9", premium: "#a78bfa" };
                const c = colors[t];
                return (
                  <div
                    key={t}
                    onClick={() => setSelectedPkg(t)}
                    style={{ padding: "0.8rem 1rem", borderRadius: "10px", border: `1px solid ${selectedPkg === t ? c : "rgba(255,255,255,0.1)"}`, background: selectedPkg === t ? `${c}22` : "rgba(255,255,255,0.03)", cursor: "pointer", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center", transition: "all 0.2s" }}
                  >
                    <div>
                      <span style={{ fontWeight: 700, color: c, textTransform: "capitalize" }}>{t}</span>
                      <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
                        {pkg.deliveryDays}d · {pkg.revisions} rev.
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: "1.1rem" }}>${pkg.price}</span>
                  </div>
                );
              })}
              {selectedPkg && (
                <button
                  className="btn-primary"
                  onClick={() => setShowModal(true)}
                  style={{ width: "100%", marginTop: "1rem", padding: "0.85rem", fontSize: "1rem" }}
                >
                  🚀 Request Service
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Request Modal ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, backdropFilter: "blur(4px)" }}>
          <div className="glass-panel" style={{ width: "100%", maxWidth: "400px", borderRadius: "16px", padding: "2rem", animation: "fadeIn 0.2s ease-out" }}>
            <h3 style={{ margin: "0 0 1rem" }}>Confirm Request</h3>
            <div style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.7)", marginBottom: "1.5rem" }}>
              Requesting the <strong style={{color:"white", textTransform:"capitalize"}}>{selectedPkg}</strong> package for <strong>${packages[selectedPkg]?.price}</strong>.
            </div>
            
            <form onSubmit={handleRequest} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.5rem", display: "block" }}>Add a note for the freelancer (optional)</label>
                <textarea
                  value={clientNote}
                  onChange={e => setClientNote(e.target.value)}
                  placeholder="Hi, I'm interested in this gig! I have a question about..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.2)", color: "white", minHeight: "80px", resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1, background: "#10b981" }}>
                  {submitting ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
