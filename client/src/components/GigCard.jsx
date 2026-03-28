import { Link } from "react-router-dom";
import { useState } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { getImageUrl, getAvatarUrl } from "../utils/image";

const CATEGORY_COLORS = {
  Design: "#a78bfa",
  Development: "#38bdf8",
  Writing: "#34d399",
  Marketing: "#fb923c",
  Video: "#f472b6",
  Music: "#facc15",
  Data: "#60a5fa",
  Other: "#94a3b8",
};

export default function GigCard({ gig, compact = false }) {
  const { auth } = useAuth();
  const [bookmarked, setBookmarked] = useState(
    gig.bookmarkedBy?.some((id) => String(id) === auth.user.id)
  );

  const handleBookmark = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const { data } = await api.post(`/gigs/${gig._id}/bookmark`);
      setBookmarked(data.bookmarked);
    } catch (_) { }
  };

  const catColor = CATEGORY_COLORS[gig.category] || "#94a3b8";
  const startingPrice = gig.packages?.basic?.price ?? 0;
  const thumb = gig.gallery?.[0] || null;

  return (
    <Link
      to={`/gigs/${gig._id}`}
      className="gig-card glass-panel"
      style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", overflow: "hidden", borderRadius: "14px", transition: "transform 0.2s, box-shadow 0.2s", position: "relative" }}
    >
      {/* Thumbnail */}
      <div className="gig-card__thumb" style={{ height: compact ? "140px" : "180px", background: "rgba(255,255,255,0.05)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "50%", background: "linear-gradient(to top, rgba(15,23,42,0.8), transparent)", pointerEvents: "none", zIndex: 1 }}></div>
        {thumb ? (
          <img src={getImageUrl(thumb)} alt={gig.title} style={{ width: "100%", height: "100%", objectFit: "cover", position: "relative", zIndex: 0 }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", background: `linear-gradient(135deg, ${catColor}22, ${catColor}44)` }}>
            {gig.category === "Design" ? "🎨" : gig.category === "Development" ? "💻" : gig.category === "Writing" ? "✍️" : gig.category === "Marketing" ? "📣" : gig.category === "Video" ? "🎬" : gig.category === "Music" ? "🎵" : gig.category === "Data" ? "📊" : "💼"}
          </div>
        )}
        {/* Category badge */}
        <span style={{ position: "absolute", top: "10px", left: "10px", background: catColor, color: "#000", fontSize: "0.7rem", fontWeight: 700, padding: "3px 10px", borderRadius: "20px", display: "flex", alignItems: "center", gap: "4px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)", zIndex: 2 }}>
          {gig.category}
        </span>
        {/* Bookmark */}
        <button
          onClick={handleBookmark}
          title={bookmarked ? "Remove bookmark" : "Bookmark"}
          style={{ position: "absolute", top: "10px", right: "10px", background: bookmarked ? "#f59e0b" : "rgba(0,0,0,0.4)", border: "none", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", zIndex: 2, backdropFilter: "blur(4px)" }}
        >
          {bookmarked ? "🔖" : "🔖"}
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "0.85rem", display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
        {/* Freelancer */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img
            src={getAvatarUrl(gig.freelancer?.avatar, gig.freelancer?.name)}
            alt={gig.freelancer?.name}
            style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover" }}
          />
          <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", fontWeight: 600 }}>
            {gig.freelancer?.name}
          </span>
        </div>

        {/* Title */}
        <h4 style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {gig.title}
        </h4>

        {/* Rating */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.78rem", color: "#facc15" }}>
          ★ <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{gig.averageRating > 0 ? gig.averageRating.toFixed(1) : "New"}</span>
          {gig.totalReviews > 0 && <span style={{ color: "var(--text-muted)" }}>({gig.totalReviews})</span>}
        </div>

        {/* Price */}
        <div style={{ marginTop: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "8px", borderTop: "1px solid var(--glass-border)" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Starting at</span>
          <span style={{ fontSize: "1.1rem", fontWeight: 800, background: "linear-gradient(135deg, var(--accent), var(--accent-cyan))", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ${startingPrice}
          </span>
        </div>
      </div>
    </Link>
  );
}
