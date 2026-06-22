import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginAdmin from "./components/LoginAdmin";
import LoginUser from "./components/LoginUser";
import DashboardAdmin from "./components/DashboardAdmin";
import ChatAdmin from "./components/ChatAdmin";
import RiwayatChat from "./components/RiwayatChat";
import AdminLayout from "./components/AdminLayout";
import ChatUser from "./components/ChatUser";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root */}
        <Route
          path="/"
          element={user ? <Navigate to="/chat" /> : <Navigate to="/login" />}
        />

        {/* Login & Register User */}
        <Route
          path="/login"
          element={user ? <Navigate to="/chat" /> : <LoginUser onLoginSuccess={handleLoginSuccess} />}
        />

        {/* Halaman Chat User - dilindungi */}
        <Route
          path="/chat"
          element={user ? <ChatUser user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}
        />

        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Portal Admin */}
        <Route path="/mimin/login" element={<LoginAdmin />} />
        <Route path="/mimin/dashboard" element={<AdminLayout><DashboardAdmin /></AdminLayout>} />
        <Route path="/mimin/chat" element={<AdminLayout><ChatAdmin /></AdminLayout>} />
        <Route path="/mimin/riwayat" element={<AdminLayout><RiwayatChat /></AdminLayout>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;