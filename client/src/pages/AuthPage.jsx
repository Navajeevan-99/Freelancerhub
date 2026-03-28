import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";

const FEATURES = [
  { icon: "🚀", text: "Find top-tier freelancers in seconds" },
  { icon: "🛡️", text: "Secure payments & milestone protection" },
  { icon: "📊", text: "Real-time project workspace & tracking" },
  { icon: "🌐", text: "Connect with a global professional network" },
];

export default function AuthPage() {
  const { saveAuth } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "client", skills: "" });
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const path = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role: form.role, skills: form.skills.split(",").map(s => s.trim()).filter(Boolean) };
      const { data } = await api.post(path, payload);
      saveAuth(data);
    } catch (err) {
      alert(err?.response?.data?.message || "Auth error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      {/* ── Left branding panel ── */}
      <div className="auth-left">
        <div className="auth-branding">
          <span className="brand-logo">⬡</span>
          <h1>Your Freelance<br />Ecosystem</h1>
          <p>The all-in-one platform where talent meets opportunity. Build, collaborate, and grow.</p>
          <div className="auth-features">
            {FEATURES.map(({ icon, text }) => (
              <div key={text} className="auth-feature-item">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right auth form ── */}
      <div className="auth-right">
        <div className="auth-card glass-panel">
          <h2>{isLogin ? "Welcome back" : "Create account"}</h2>
          <p className="auth-subtitle muted">
            {isLogin ? "Sign in to continue to FreelancerHub" : "Join thousands of professionals today"}
          </p>

          <form onSubmit={submit} className="auth-form">
            {!isLogin && (
              <div className="input-group">
                <label>Full Name</label>
                <input
                  placeholder="John Doe"
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label>Email Address</label>
              <input
                placeholder="you@example.com"
                type="email"
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label>Password</label>
              <input
                placeholder={isLogin ? "Enter your password" : "Create a password"}
                type="password"
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>

            {!isLogin && (
              <>
                <div className="input-group">
                  <label>I am a...</label>
                  <select onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="client">Client — I want to hire</option>
                    <option value="freelancer">Freelancer — I want to work</option>
                  </select>
                </div>
                {form.role === "freelancer" && (
                  <div className="input-group">
                    <label>Top Skills (comma-separated)</label>
                    <input
                      placeholder="e.g. React, Node.js, Design"
                      onChange={e => setForm({ ...form, skills: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              className="btn-primary auth-btn"
              disabled={loading}
              style={{ marginTop: "8px", opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Please wait..." : isLogin ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          <p className="auth-toggle">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <span onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? "Sign up" : "Sign in"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
