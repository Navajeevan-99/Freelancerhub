import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import AuthPage from "./pages/AuthPage";
import Feed from "./pages/Feed";
import Profile from "./pages/Profile";
import Workspace from "./pages/Workspace";
import Dashboard from "./pages/Dashboard";
import Network from "./pages/Network";
import Messages from "./pages/Messages";
import Marketplace from "./pages/Marketplace";
import GigDetail from "./pages/GigDetail";
import GigCreate from "./pages/GigCreate";
import OrderRequirements from "./pages/OrderRequirements";
import { socket } from "./socket";

function AppRoutes() {
  const { auth } = useAuth();

  React.useEffect(() => {
    if (auth.user) {
      socket.emit("register", auth.user.id);
    }
  }, [auth.user]);

  if (!auth.user) return <AuthPage />;

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/network" element={<Network />} />
          <Route path="/workspace/:id?" element={<Workspace />} />
          <Route path="/messages/:id?" element={<Messages />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/gigs/create" element={<GigCreate />} />
          <Route path="/gigs/:id" element={<GigDetail />} />
          <Route path="/orders/:id/requirements" element={<OrderRequirements />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
