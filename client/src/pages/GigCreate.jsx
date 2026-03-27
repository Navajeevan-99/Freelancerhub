import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

const CATEGORIES = ["Design", "Development", "Writing", "Marketing", "Video", "Music", "Data", "Other"];

const EMPTY_PKG = { price: "", deliveryDays: "", revisions: "", features: [""] };

const STEPS = ["📋 Basics", "💰 Pricing", "🖼️ Gallery"];

export default function GigCreate() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [galleryPreviews, setGalleryPreviews] = useState([]);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "Design",
    tags: "",
    packages: {
      basic: { ...EMPTY_PKG },
      standard: { ...EMPTY_PKG },
      premium: { ...EMPTY_PKG },
    },
  });

  // ── Helpers ──────────────────────────────────────────────────────
  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const setPkg = (tier, field, value) =>
    setForm(prev => ({
      ...prev,
      packages: {
        ...prev.packages,
        [tier]: { ...prev.packages[tier], [field]: value },
      },
    }));

  const setFeature = (tier, idx, value) => {
    const features = [...(form.packages[tier].features || [""])];
    features[idx] = value;
    setPkg(tier, "features", features);
  };

  const addFeature = (tier) => setPkg(tier, "features", [...(form.packages[tier].features || [""]), ""]);
  const removeFeature = (tier, idx) => {
    const features = form.packages[tier].features.filter((_, i) => i !== idx);
    setPkg(tier, "features", features.length ? features : [""]);
  };

  const handleGalleryChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 4);
    setGalleryFiles(files);
    setGalleryPreviews(files.map(f => URL.createObjectURL(f)));
  };

  // ── Submit ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("title", form.title);
      fd.append("description", form.description);
      fd.append("category", form.category);
      fd.append("tags", form.tags);

      // Prepare packages — parse numbers
      const pkgs = {};
      ["basic", "standard", "premium"].forEach(t => {
        const p = form.packages[t];
        pkgs[t] = {
          price: Number(p.price) || 0,
          deliveryDays: Number(p.deliveryDays) || 1,
          revisions: Number(p.revisions) || 1,
          features: p.features.filter(Boolean),
        };
      });
      fd.append("packages", JSON.stringify(pkgs));

      galleryFiles.forEach(f => fd.append("gallery", f));

      const { data } = await api.post("/gigs", fd, { headers: { "Content-Type": "multipart/form-data" } });
      navigate(`/gigs/${data._id}`);
    } catch (err) {
      alert(err?.response?.data?.message || "Failed to create gig");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { width: "100%", padding: "0.7rem 1rem", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.25)", color: "white", fontSize: "0.95rem", boxSizing: "border-box" };
  const labelStyle = { fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.35rem", display: "block" };

  // ── Render steps ─────────────────────────────────────────────────
  const renderStep = () => {
    if (step === 0) return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label style={labelStyle}>Gig Title *</label>
          <input style={inputStyle} placeholder="e.g. I will design a professional logo..." value={form.title} onChange={e => set("title", e.target.value)} maxLength={100} />
          <small style={{ color: "rgba(255,255,255,0.35)" }}>{form.title.length}/100</small>
        </div>
        <div>
          <label style={labelStyle}>Category *</label>
          <select style={inputStyle} value={form.category} onChange={e => set("category", e.target.value)}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Description *</label>
          <textarea style={{ ...inputStyle, resize: "vertical", minHeight: "140px" }} placeholder="Describe what you offer in detail..." value={form.description} onChange={e => set("description", e.target.value)} />
        </div>
        <div>
          <label style={labelStyle}>Tags (comma separated)</label>
          <input style={inputStyle} placeholder="logo, branding, vector" value={form.tags} onChange={e => set("tags", e.target.value)} />
        </div>
      </div>
    );

    if (step === 1) return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {[
          { key: "basic", label: "Basic", color: "#64748b" },
          { key: "standard", label: "Standard", color: "#0ea5e9" },
          { key: "premium", label: "Premium", color: "#a78bfa" },
        ].map(({ key, label, color }) => (
          <div key={key} className="glass-panel" style={{ padding: "1.25rem", borderRadius: "14px", border: `1px solid ${color}33` }}>
            <h3 style={{ color, marginTop: 0, marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "10px", height: "10px", background: color, borderRadius: "50%", display: "inline-block" }} />
              {label} Package
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
              <div>
                <label style={labelStyle}>Price ($) *</label>
                <input type="number" min="1" style={inputStyle} placeholder="50" value={form.packages[key].price} onChange={e => setPkg(key, "price", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Delivery (days) *</label>
                <input type="number" min="1" style={inputStyle} placeholder="3" value={form.packages[key].deliveryDays} onChange={e => setPkg(key, "deliveryDays", e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Revisions</label>
                <input type="number" min="0" style={inputStyle} placeholder="2" value={form.packages[key].revisions} onChange={e => setPkg(key, "revisions", e.target.value)} />
              </div>
            </div>
            <label style={labelStyle}>Features</label>
            {(form.packages[key].features || [""]).map((f, idx) => (
              <div key={idx} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <input style={{ ...inputStyle, flex: 1 }} placeholder={`Feature ${idx + 1}`} value={f} onChange={e => setFeature(key, idx, e.target.value)} />
                <button onClick={() => removeFeature(key, idx)} style={{ background: "none", border: "1px solid #ef444455", borderRadius: "8px", color: "#ef4444", padding: "0 12px", cursor: "pointer" }}>✕</button>
              </div>
            ))}
            <button onClick={() => addFeature(key)} style={{ background: "none", border: `1px dashed ${color}`, borderRadius: "8px", color, padding: "6px 14px", cursor: "pointer", fontSize: "0.85rem", marginTop: "0.25rem" }}>
              + Add Feature
            </button>
          </div>
        ))}
      </div>
    );

    if (step === 2) return (
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div>
          <label style={labelStyle}>Upload Gallery (up to 4 images/videos)</label>
          <label style={{ ...inputStyle, display: "flex", alignItems: "center", justifyContent: "center", height: "120px", cursor: "pointer", border: "2px dashed rgba(255,255,255,0.2)", borderRadius: "14px", fontSize: "0.9rem", color: "rgba(255,255,255,0.5)" }}>
            📁 Click to choose files
            <input type="file" accept="image/*,video/*" multiple style={{ display: "none" }} onChange={handleGalleryChange} />
          </label>
        </div>

        {galleryPreviews.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem" }}>
            {galleryPreviews.map((src, i) => (
              <div key={i} style={{ aspectRatio: "1", borderRadius: "10px", overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)" }}>
                <img src={src} alt={`preview-${i}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}

        {/* Summary Preview */}
        <div className="glass-panel" style={{ padding: "1.25rem", borderRadius: "14px" }}>
          <h4 style={{ margin: "0 0 0.5rem" }}>Preview Summary</h4>
          <p style={{ margin: "0 0 0.25rem", color: "rgba(255,255,255,0.8)" }}><strong>{form.title || "No title yet"}</strong></p>
          <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>{form.category} · Starting from <strong style={{ color: "#00f0ff" }}>${form.packages.basic.price || 0}</strong></p>
        </div>
      </div>
    );
  };

  const canNext = () => {
    if (step === 0) return form.title.trim() && form.description.trim();
    if (step === 1) return form.packages.basic.price && form.packages.basic.deliveryDays;
    return true;
  };

  return (
    <div className="page-container" style={{ maxWidth: "760px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "0.25rem" }}>Create a New Gig</h1>
      <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem" }}>Showcase your services to thousands of clients</p>

      {/* Step indicators */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "2rem" }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: i < step ? "#00f0ff" : i === step ? "rgba(0,240,255,0.25)" : "rgba(255,255,255,0.1)", border: `2px solid ${i <= step ? "#00f0ff" : "rgba(255,255,255,0.15)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, color: i < step ? "#000" : i === step ? "#00f0ff" : "rgba(255,255,255,0.4)", transition: "all 0.3s" }}>
              {i < step ? "✓" : i + 1}
            </div>
            <span style={{ fontSize: "0.75rem", color: i === step ? "#00f0ff" : "rgba(255,255,255,0.4)", textAlign: "center" }}>{s}</span>
          </div>
        ))}
      </div>

      <div className="glass-panel" style={{ padding: "2rem", borderRadius: "16px", marginBottom: "1.5rem" }}>
        {renderStep()}
      </div>

      {/* Navigation buttons */}
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button onClick={() => setStep(s => s - 1)} disabled={step === 0} className="btn-secondary" style={{ padding: "0.75rem 1.5rem", opacity: step === 0 ? 0.4 : 1 }}>
          ← Back
        </button>
        {step < STEPS.length - 1 ? (
          <button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="btn-primary" style={{ padding: "0.75rem 2rem", opacity: canNext() ? 1 : 0.4 }}>
            Next →
          </button>
        ) : (
          <button onClick={handleSubmit} disabled={submitting} className="btn-primary" style={{ padding: "0.75rem 2rem" }}>
            {submitting ? "Publishing..." : "🚀 Publish Gig"}
          </button>
        )}
      </div>
    </div>
  );
}
