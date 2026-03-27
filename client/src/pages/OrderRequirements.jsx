import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { getImageUrl } from "../utils/image";

export default function OrderRequirements() {
  const { id } = useParams();   // order id
  const { auth } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
  });

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(r => {
        setOrder(r.data);
        // Pre-fill title from gig name
        setForm(f => ({ ...f, title: r.data.gig?.title || "" }));
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFiles = (e) => {
    const chosen = Array.from(e.target.files);
    setFiles(chosen);
    setPreviews(chosen.map(f => ({
      name: f.name,
      src: f.type.startsWith("image/") ? URL.createObjectURL(f) : null,
      type: f.type,
      size: (f.size / 1024).toFixed(1) + " KB",
    })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      alert("Please fill in title and description.");
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("instructions", form.instructions);
      files.forEach(f => fd.append("files", f));

      await api.put(`/orders/${id}/requirements`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Redirect to workspace if project exists
      const updated = await api.get(`/orders/${id}`);
      const projId = updated.data.project?._id || updated.data.project;
      if (projId) navigate(`/workspace/${projId}`);
      else navigate("/");
    } catch (err) {
      alert(err?.response?.data?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ textAlign: "center", padding: "4rem", color: "rgba(255,255,255,0.5)" }}>⏳ Loading...</div>;
  if (!order) return null;

  const inputStyle = { width: "100%", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.95rem", boxSizing: "border-box" };
  const labelStyle = { fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "0.35rem", display: "block" };

  return (
    <div className="page-container" style={{ maxWidth: "720px", margin: "0 auto" }}>

      {/* Order Header */}
      <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "16px", display: "flex", gap: "1rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
        {order.gig?.gallery?.[0] && (
          <img src={getImageUrl(order.gig.gallery[0])} alt="gig" style={{ width: "64px", height: "64px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }} />
        )}
        <div>
          <div style={{ fontSize: "0.75rem", color: "#10b981", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "4px" }}>✅ REQUEST ACCEPTED</div>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.1rem" }}>{order.gig?.title}</h2>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", textTransform: "capitalize" }}>
            {order.selectedPackage} package · {order.packageSnapshot?.deliveryDays} day delivery · ${order.packageSnapshot?.price}
          </div>
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginTop: "4px" }}>
            Freelancer: <Link to={`/profile/${order.freelancer?._id}`} style={{ color: "var(--accent)" }}>{order.freelancer?.name}</Link>
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "2rem", borderRadius: "16px" }}>
        <h3 style={{ margin: "0 0 1.5rem" }}>📝 Submit Your Requirements</h3>
        <p style={{ color: "var(--text-muted)", marginBottom: "1.5rem", fontSize: "0.88rem", lineHeight: 1.7 }}>
          Help the freelancer understand exactly what you need. The more detail you provide, the better the result!
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div>
            <label style={labelStyle}>Project Title *</label>
            <input style={inputStyle} placeholder="e.g. Modern Logo for Tech Startup" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>

          <div>
            <label style={labelStyle}>Detailed Description *</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: "120px" }}
              placeholder="Describe your project in detail. What do you want the final result to look like?"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
            />
          </div>

          <div>
            <label style={labelStyle}>Specific Instructions / Notes</label>
            <textarea
              style={{ ...inputStyle, resize: "vertical", minHeight: "90px" }}
              placeholder="Color preferences, style references, formats needed, audience, brand guidelines..."
              value={form.instructions}
              onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
            />
          </div>

          {/* File Upload */}
          <div>
            <label style={labelStyle}>Upload Reference Files (optional – images, videos, docs)</label>
            <label style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "center", height: "100px", cursor: "pointer", border: "2px dashed var(--glass-border)", borderRadius: "12px", flexDirection: "column", gap: "6px", color: "var(--text-muted)", fontSize: "0.88rem", background: "var(--bg-secondary)" }}>
              <span style={{ fontSize: "1.8rem" }}>📎</span>
              Click to attach files (unlimited)
              <input type="file" multiple onChange={handleFiles} style={{ display: "none" }} />
            </label>

            {previews.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.5rem", marginTop: "0.75rem" }}>
                {previews.map((p, i) => (
                  <div key={i} style={{ background: "var(--bg-secondary)", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--glass-border)" }}>
                    {p.src ? (
                      <img src={p.src} alt={p.name} style={{ width: "100%", height: "80px", objectFit: "cover" }} />
                    ) : (
                      <div style={{ height: "80px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
                        {p.type.includes("pdf") ? "📄" : p.type.includes("video") ? "🎬" : p.type.includes("zip") ? "🗜️" : "📎"}
                      </div>
                    )}
                    <div style={{ padding: "0.35rem 0.5rem", fontSize: "0.7rem", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name} <span style={{ color: "var(--text-muted)", opacity: 0.6 }}>· {p.size}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
            <button type="button" onClick={() => navigate("/")} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary" style={{ flex: 2, padding: "0.85rem", fontSize: "1rem" }}>
              {submitting ? "Submitting..." : "🚀 Submit & Start Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
