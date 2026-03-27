import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { auth, logout } = useAuth();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const active = (to) => pathname === to || pathname.startsWith(to + "/") ? { color: "var(--accent)", fontWeight: 700 } : {};
  return (
    <header className="navbar glass">
      <div className="nav-brand"><h2>FreelancerHub</h2></div>
      <nav className="nav-links">
        <Link to="/" style={active("/") && pathname === "/" ? { color: "var(--accent)", fontWeight: 700 } : {}}>Dashboard</Link>
        <Link to="/feed" style={active("/feed")}>Explore</Link>
        <Link to="/marketplace" style={active("/marketplace")}>🛒 Marketplace</Link>
        <Link to="/network" style={active("/network")}>Network</Link>
        <Link to="/messages" style={active("/messages")}>Messages</Link>
        <Link to="/workspace" style={active("/workspace")}>Workspace</Link>
        <Link to={`/profile/${auth.user.id}`} style={active("/profile")}>Profile</Link>
        <button onClick={toggleTheme} className="btn-icon" style={{ fontSize: "1.2rem", padding: "4px" }}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <button onClick={logout} className="btn-secondary">Logout</button>
      </nav>
    </header>
  );
}
