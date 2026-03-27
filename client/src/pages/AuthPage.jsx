import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api";

export default function AuthPage() {
  const { saveAuth } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "client", skills: "" });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const path = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin ? { email: form.email, password: form.password } : {
        name: form.name, email: form.email, password: form.password, role: form.role,
        skills: form.skills.split(",").map(s => s.trim()).filter(Boolean),
      };
      const { data } = await api.post(path, payload);
      saveAuth(data);
    } catch (err) {
      alert(err?.response?.data?.message || "Auth error");
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card glass">
        <h2>{isLogin ? "Welcome Back" : "Join FreelancerHub"}</h2>
        <form onSubmit={submit} className="auth-form">
          {!isLogin && <input placeholder="Full Name" onChange={e => setForm({...form, name: e.target.value})} required />}
          <input placeholder="Email" type="email" onChange={e => setForm({...form, email: e.target.value})} required />
          <input placeholder="Password" type="password" onChange={e => setForm({...form, password: e.target.value})} required />
          {!isLogin && (
            <select onChange={e => setForm({...form, role: e.target.value})}>
              <option value="client">I'm a Client</option>
              <option value="freelancer">I'm a Freelancer</option>
            </select>
          )}
          <button className="btn-primary auth-btn">{isLogin ? "Login" : "Register"}</button>
        </form>
        <p className="auth-toggle" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? "Need an account? Register" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}
