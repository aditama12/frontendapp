import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import logoSakti from "../assets/logoBlue.png";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      await api.get("/sanctum/csrf-cookie");
      const response = await api.post("/api/password/reset-link", { email });
      setStatus({ type: "success", message: response.data.message });
    } catch (err) {
      setStatus({ 
        type: "error", 
        message: err.response?.data?.message || "Gagal mengirim link reset password." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8faff] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute rounded-full pointer-events-none w-[50vw] h-[50vw] -top-[10vw] -left-[10vw] bg-gradient-to-br from-blue-600 to-blue-800 opacity-20 blur-3xl z-0" />
      
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 relative z-10 border border-gray-100">
        <div className="text-center mb-6">
          <img src={logoSakti} alt="Logo" className="w-12 h-12 mx-auto mb-3" />
          <h2 className="text-2xl font-bold text-gray-800">Lupa Password?</h2>
          <p className="text-sm text-gray-500 mt-1">Masukkan email Anda untuk menerima tautan reset password.</p>
        </div>

        {status.message && (
          <div className={`p-3 rounded-xl mb-4 text-sm font-medium ${status.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {status.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-600 block mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Masukkan email terdaftar"
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl py-3 text-sm transition-all disabled:opacity-70"
          >
            {loading ? "Mengirim..." : "Kirim Link Reset"}
          </button>
        </form>
        
        <div className="mt-6 text-center text-sm">
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            &larr; Kembali ke halaman Login
          </Link>
        </div>
      </div>
    </div>
  );
}