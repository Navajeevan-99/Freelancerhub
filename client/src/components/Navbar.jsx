import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function Navbar() {
  const { auth, logout } = useAuth();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();

  const isActive = (to) => {
    if (to === "/") return pathname === "/";
    return pathname === to || pathname.startsWith(to + "/");
  };

  return (
    <header className="navbar">
      <div className="nav-brand">
        <h2>FreelancerHub</h2>
      </div>
      <nav className="nav-links">
        <Link to="/"          className={isActive("/") ? "active-link" : ""}>Dashboard</Link>
        <Link to="/feed"      className={isActive("/feed") ? "active-link" : ""}>Explore</Link>
        <Link to="/marketplace" className={isActive("/marketplace") ? "active-link" : ""}>Marketplace</Link>
        <Link to="/network"   className={isActive("/network") ? "active-link" : ""}>Network</Link>
        <Link to="/messages"  className={isActive("/messages") ? "active-link" : ""}>Messages</Link>
        <Link to="/workspace" className={isActive("/workspace") ? "active-link" : ""}>Workspace</Link>
        <Link to={`/profile/${auth.user.id}`} className={isActive("/profile") ? "active-link" : ""}>Profile</Link>
        <button
          onClick={toggleTheme}
          className="btn-icon"
          style={{ fontSize: "1.1rem", padding: "6px 8px", marginLeft: "4px" }}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? "🌙" : "☀️"}
        </button>
        <button onClick={logout} className="btn-secondary" style={{ marginLeft: "4px", fontSize: "0.85rem", padding: "6px 14px" }}>
          Logout
        </button>
      </nav>
    </header>
  );
}
