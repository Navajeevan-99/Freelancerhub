import React, { createContext, useContext, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);
const emptyAuth = { token: "", user: null };

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    return token && user ? { token, user: JSON.parse(user) } : emptyAuth;
  });

  const saveAuth = (payload) => {
    localStorage.setItem("token", payload.token);
    localStorage.setItem("user", JSON.stringify(payload.user));
    setAuth(payload);
  };

  const logout = () => {
    localStorage.clear();
    setAuth(emptyAuth);
  };

  const refreshUser = async () => {
    if (!auth.user?.id) return;
    try {
      const { data } = await api.get(`/users/${auth.user.id}`);
      const payload = { token: auth.token, user: { ...auth.user, ...data, id: auth.user.id } };
      saveAuth(payload);
    } catch(err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider value={{ auth, saveAuth, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
