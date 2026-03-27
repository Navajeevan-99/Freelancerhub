import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api";
import GigCard from "../components/GigCard";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["All", "Design", "Development", "Writing", "Marketing", "Video", "Music", "Data", "Other"];

const CAT_ICONS = {
  All: "🌐", Design: "🎨", Development: "💻", Writing: "✍️",
  Marketing: "📣", Video: "🎬", Music: "🎵", Data: "📊", Other: "💼"
};

export default function Marketplace() {
  const { auth } = useAuth();
  const navigate = useNavigate();

  const [gigs, setGigs] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort] = useState("newest");

  // Fetch featured on mount
  useEffect(() => {
    api.get("/gigs/featured").then(r => setFeatured(r.data)).catch(() => {});
  }, []);

  // Fetch gigs on filter change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (category !== "All") params.set("category", category);
    if (search) params.set("search", search);
    if (sort !== "newest") params.set("sort", sort === "rating" ? "rating" : "orders");

    api.get(`/gigs?${params.toString()}`)
      .then(r => setGigs(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category, search, sort]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 450);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div className="page-container">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div className="marketplace-hero glass-panel" style={{ padding: "3rem 2.5rem", marginBottom: "2.5rem", background: "radial-gradient(circle at center, rgba(0,240,255,0.15) 0%, rgba(138,43,226,0.1) 100%), var(--glass-bg)", borderRadius: "20px", textAlign: "center", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-50px", left: "-50px", width: "200px", height: "200px", background: "rgba(0,240,255,0.2)", filter: "blur(60px)", borderRadius: "50%", zIndex: 0 }}></div>
        <div style={{ position: "absolute", bottom: "-50px", right: "-50px", width: "200px", height: "200px", background: "rgba(138,43,226,0.2)", filter: "blur(60px)", borderRadius: "50%", zIndex: 0 }}></div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", margin: 0, fontWeight: 800, letterSpacing: "-0.5px" }}>
            Find the perfect <span style={{ color: "#00f0ff", textShadow: "0 0 20px rgba(0,240,255,0.4)" }}>service</span> for your project
          </h1>
          <p style={{ color: "var(--text-muted)", marginTop: "0.75rem", fontSize: "1.1rem" }}>
            Browse thousands of gigs from top freelancers
          </p>

          {/* Search */}
          <div style={{ display: "flex", gap: "0.5rem", maxWidth: "540px", margin: "2rem auto 0", padding: "6px", background: "rgba(0,0,0,0.2)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.1)", backdropFilter: "blur(10px)" }}>
            <input
              type="text"
              placeholder="Search for a service..."
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              style={{ flex: 1, padding: "0.75rem 1rem", border: "none", background: "transparent", color: "var(--text-primary)", fontSize: "1rem", outline: "none" }}
            />
            <button
              className="btn-primary"
              onClick={() => setSearch(searchInput)}
              style={{ padding: "0.75rem 1.5rem", borderRadius: "10px", display: "flex", alignItems: "center", gap: "8px" }}
            >
              🔍 Search
            </button>
            {auth.user?.role === "freelancer" && (
              <button className="btn-primary" onClick={() => navigate("/gigs/create")} style={{ padding: "0.75rem 1.2rem", borderRadius: "10px", whiteSpace: "nowrap", background: "rgba(255,255,255,0.1)" }}>
                + Create Gig
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Category chips ────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "20px",
              border: category === cat ? "1px solid #00f0ff" : "1px solid rgba(255,255,255,0.15)",
              background: category === cat ? "rgba(0,240,255,0.15)" : "rgba(255,255,255,0.05)",
              color: category === cat ? "#00f0ff" : "rgba(255,255,255,0.75)",
              cursor: "pointer",
              fontWeight: category === cat ? 700 : 400,
              fontSize: "0.85rem",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            {CAT_ICONS[cat]} {cat}
          </button>
        ))}

        {/* Sort */}
        <select
          value={sort}
          onChange={e => setSort(e.target.value)}
          style={{ marginLeft: "auto", padding: "0.45rem 0.75rem", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", color: "white", fontSize: "0.85rem", cursor: "pointer" }}
        >
          <option value="newest">Newest</option>
          <option value="rating">Top Rated</option>
          <option value="orders">Most Orders</option>
        </select>
      </div>

      {/* ── Featured section ─────────────────────────────────────── */}
      {!search && category === "All" && featured.length > 0 && (
        <section style={{ marginBottom: "2.5rem" }}>
          <h2 style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
            🔥 <span>Featured Gigs</span>
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
            {featured.slice(0, 4).map(gig => (
              <GigCard key={gig._id} gig={gig} compact />
            ))}
          </div>
        </section>
      )}

      {/* ── Main gig grid ─────────────────────────────────────────── */}
      <section>
        <h2 style={{ marginBottom: "1rem" }}>
          {search ? `Results for "${search}"` : category === "All" ? "All Gigs" : `${CAT_ICONS[category]} ${category} Gigs`}
          <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", fontWeight: 400, marginLeft: "0.75rem" }}>
            {gigs.length} found
          </span>
        </h2>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "rgba(255,255,255,0.4)" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>⏳</div>
            Loading gigs...
          </div>
        ) : gigs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon" style={{ fontSize: "4rem" }}>🔍</div>
            <h3 style={{ color: "var(--text-primary)", margin: "0.5rem 0" }}>No Gigs Found</h3>
            <p style={{ color: "var(--text-muted)", maxWidth: "400px" }}>
              {search ? `We couldn't find any gigs matching "${search}". Try adjusting your keywords or category filters.` : "There are currently no gigs available in this category."}
            </p>
            {auth.user?.role === "freelancer" && (
              <button className="btn-primary" onClick={() => navigate("/gigs/create")} style={{ marginTop: "1.5rem", padding: "0.8rem 1.5rem" }}>
                Be the first — Create a Gig
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "1.25rem" }}>
            {gigs.map(gig => (
              <GigCard key={gig._id} gig={gig} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
