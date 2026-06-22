import { useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import logoSakti from "../assets/logoBlue.png";

export default function ResetPassword() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  // State mata password (biar seragam sama halaman Login)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirmation) {
      setStatus({ type: "error", message: "Konfirmasi password tidak cocok!" });
      return;
    }

    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      await api.get("/sanctum/csrf-cookie");
      await api.post("/api/password/reset", {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      setStatus({ type: "success", message: "Password berhasil diubah! Mengalihkan ke login..." });
      setTimeout(() => {
        window.location.href = "/login";
      }, 3000);
    } catch (err) {
      setStatus({ 
        type: "error", 
        message: err.response?.data?.message || "Gagal mengubah password." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // Mengunci layar penuh anti-scroll mutlak
    <div className="h-screen w-screen relative overflow-hidden flex items-center justify-center bg-[#f8faff] font-sans select-none">
      
      {/* Element Lingkaran Background (Sama persis kayak Login) */}
      <div className="absolute rounded-full pointer-events-none" style={{
        width: "55vw", height: "55vw", top: "-15vw", left: "-12vw",
        background: "linear-gradient(135deg, #0073e6 0%, #0033aa 100%)", zIndex: 1
      }} />

      <div className="absolute rounded-full pointer-events-none" style={{
        width: "40vw", height: "40vw", bottom: "-10vw", left: "-8vw",
        background: "linear-gradient(135deg, #002b80 0%, #001440 100%)", zIndex: 2
      }} />

      <div className="absolute rounded-full pointer-events-none hidden md:block" style={{
        width: "23vw", height: "23vw", bottom: "10vh", left: "20vw",
        background: "linear-gradient(135deg, #0052cc 0%, #002266 100%)",
        boxShadow: "0 15px 35px rgba(0, 34, 102, 0.2)", zIndex: 3
      }} />

      <div className="absolute rounded-full pointer-events-none" style={{
        width: "16vw", height: "16vw", bottom: "-6vw", right: "-3vw",
        background: "linear-gradient(135deg, #0066ff 0%, #002b80 100%)", zIndex: 1
      }} />

      {/* ================= MAIN CONTAINER LAYER ================= */}
      <div className="relative z-10 w-full px-4 sm:px-0 lg:ml-[35vw] xl:ml-[40vw] transition-all duration-300 max-w-[420px]">
        
        {/* Glow Ambient */}
        <div className="absolute -inset-4 bg-blue-600/15 rounded-[2.5rem] blur-2xl opacity-90 pointer-events-none z-0" />

        {/* 📦 KOTAK UTAMA DINAMIS */}
        <div
          className="relative z-10 bg-white/95 bg-clip-padding border-[12px] border-white/30 backdrop-blur-xl rounded-[2.5rem] w-full px-9 py-8 space-y-4"
          style={{ boxShadow: "0 30px 70px -10px rgba(0, 39, 115, 0.22)" }}
        >
          {/* HEADER AREA */}
          <div className="text-center space-y-1">
            <div className="mx-auto flex items-center justify-center w-10 h-10 transition-all">
              <img src={logoSakti} alt="Logo SAKTI" className="w-full h-full object-contain" />
            </div>
            <h2 className="font-bold text-gray-800 tracking-tight text-2xl pt-1">
              Buat Password Baru
            </h2>
            <p className="text-xs text-gray-400 font-medium">
              Silahkan ketik password baru untuk akun Anda
            </p>
          </div>

          {/* STATUS BOX */}
          {status.message && (
            <div className={`border px-3 py-2 rounded-xl text-xs font-semibold text-center ${
              status.type === 'success' 
                ? 'bg-green-50 border-green-200 text-green-600' 
                : 'bg-red-50 border-red-200 text-red-600'
            }`}>
              {status.message}
            </div>
          )}

          {/* 📝 FORM FIELD */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            
            {/* INPUT FIELD EMAIL (Disabled) */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-gray-600 tracking-wide block">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full bg-gray-100 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-500 cursor-not-allowed font-medium"
                />
              </div>
            </div>

            {/* INPUT FIELD PASSWORD BARU */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-gray-600 tracking-wide block">
                Password Baru
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white text-gray-800 font-medium placeholder:text-gray-400 transition-all"
                  placeholder="Ketik password baru"
                  required
                  disabled={loading}
                  minLength="8"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* INPUT FIELD KONFIRMASI PASSWORD */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-bold text-gray-600 tracking-wide block">
                Konfirmasi Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={passwordConfirmation}
                  onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white text-gray-800 font-medium placeholder:text-gray-400 transition-all"
                  placeholder="Ulangi password baru"
                  required
                  disabled={loading}
                  minLength="8"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  disabled={loading}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* 🔘 TOMBOL ACTIONS SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2 disabled:opacity-70 py-4 mt-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Menyimpan...
                </>
              ) : (
                "Simpan Password Baru"
              )}
            </button>
          </form>

          {/* FOOTER */}
          <p className="text-center text-[10px] text-gray-400 font-bold pt-2">
            2026 Dinas Kependudukan dan Pencatatan Sipil Sidoarjo
          </p>
        </div>
      </div>
    </div>
  );
}