export default function PackageCompare({ packages, onSelect }) {
  if (!packages) return null;
  const tiers = [
    { key: "basic", label: "Basic", color: "#64748b", gradient: "linear-gradient(135deg,#1e293b,#334155)" },
    { key: "standard", label: "Standard", color: "#0ea5e9", gradient: "linear-gradient(135deg,#0c4a6e,#0ea5e9)" },
    { key: "premium", label: "Premium", color: "#a78bfa", gradient: "linear-gradient(135deg,#4c1d95,#7c3aed)" },
  ];

  return (
    <div className="package-compare" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginTop: "1rem" }}>
      {tiers.map(({ key, label, color, gradient }) => {
        const pkg = packages[key];
        if (!pkg) return null;
        return (
          <div
            key={key}
            className="package-tier"
            style={{
              background: gradient,
              border: `1px solid ${color}55`,
              borderRadius: "14px",
              padding: "1.25rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              transition: "transform 0.2s, box-shadow 0.2s",
            }}
          >
            {/* Header */}
            <div style={{ borderBottom: `1px solid ${color}44`, paddingBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.1em", color, textTransform: "uppercase" }}>
                {label}
              </span>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, marginTop: "0.25rem" }}>
                ${pkg.price ?? 0}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.85rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>⏱ Delivery</span>
                <strong>{pkg.deliveryDays ?? 1} day{(pkg.deliveryDays ?? 1) !== 1 ? "s" : ""}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "rgba(255,255,255,0.6)" }}>🔁 Revisions</span>
                <strong>{pkg.revisions === -1 ? "Unlimited" : (pkg.revisions ?? 1)}</strong>
              </div>
            </div>

            {/* Features */}
            {pkg.features?.length > 0 && (
              <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {pkg.features.map((f, i) => (
                  <li key={i} style={{ fontSize: "0.8rem", display: "flex", alignItems: "flex-start", gap: "6px", color: "rgba(255,255,255,0.85)" }}>
                    <span style={{ color, flexShrink: 0 }}>✓</span> {f}
                  </li>
                ))}
              </ul>
            )}

            {/* Select button */}
            {onSelect && (
              <button
                onClick={() => onSelect(key)}
                style={{
                  marginTop: "auto",
                  padding: "0.6rem",
                  borderRadius: "8px",
                  border: `1px solid ${color}`,
                  background: "transparent",
                  color,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.85rem",
                  transition: "background 0.2s, color 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = color; e.currentTarget.style.color = "#000"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = color; }}
              >
                Select {label}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
