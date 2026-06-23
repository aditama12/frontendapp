import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import logoSakti from "../assets/logoBlue.png";

function LoginUser({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // State mata password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let response;

      if (isRegister) {
        response = await api.post("/api/register", {
          name,
          email,
          password,
          password_confirmation: passwordConfirmation,
        });
      } else {
        response = await api.post("/api/login", {
          email,
          password,
          role: "user",
        });
      }

      // Pastikan backend mengirimkan user dan token
      if (response.data?.user && response.data?.token) {
        onLoginSuccess(response.data.user, response.data.token);
      }
    } catch (err) {
      console.error("Login/Register Error:", err);

      setError(
        typeof err === "string"
          ? err
          : err?.response?.data?.message ||
              "Terjadi kesalahan, periksa kembali data Anda."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // Mengunci layar penuh anti-scroll mutlak
    <div className="h-screen w-screen relative overflow-hidden flex items-center justify-center bg-[#f8faff] font-sans select-none">
      
      {/* Element Lingkaran Background */}
      <div className="absolute rounded-full pointer-events-none" style={{
        width: "55vw", height: "55vw", top: "-15vw", left: "-12vw",
        background: "linear-gradient(135deg, #0073e6 0%, #0033aa 100%)", zIndex: 1
      }} />

      <div className="absolute rounded-full pointer-events-none" style={{
        width: "40vw", height: "40vw", bottom: "-10vw", left: "-8vw",
        background: "linear-gradient(135deg, #002b80 0%, #001440 100%)", zIndex: 2
      }} />

      <div className="absolute hidden rounded-full pointer-events-none md:block" style={{
        width: "23vw", height: "23vw", bottom: "10vh", left: "20vw",
        background: "linear-gradient(135deg, #0052cc 0%, #002266 100%)",
        boxShadow: "0 15px 35px rgba(0, 34, 102, 0.2)", zIndex: 3
      }} />

      <div className="absolute rounded-full pointer-events-none" style={{
        width: "16vw", height: "16vw", bottom: "-6vw", right: "-3vw",
        background: "linear-gradient(135deg, #0066ff 0%, #002b80 100%)", zIndex: 1
      }} />

      {/* ================= MAIN CONTAINER LAYER ================= */}
      <div className={`relative z-10 w-full px-4 sm:px-0 lg:ml-[35vw] xl:ml-[40vw] transition-all duration-300 ${
        isRegister ? "max-w-[380px]" : "max-w-[420px]"
      }`}>
        
        {/* Glow Ambient */}
        <div className="absolute -inset-4 bg-blue-600/15 rounded-[2.5rem] blur-2xl opacity-90 pointer-events-none z-0" />

        {/* 📦 KOTAK UTAMA DINAMIS */}
        <div
          className={`relative z-10 bg-white/95 bg-clip-padding border-[12px] border-white/30 backdrop-blur-xl rounded-[2.5rem] w-full transition-all duration-300 ${
            isRegister ? "px-7 py-4 space-y-2.5" : "px-9 py-8 space-y-4"
          }`}
          style={{ 
            boxShadow: "0 30px 70px -10px rgba(0, 39, 115, 0.22)" 
          }}
        >
          {/* HEADER AREA */}
          <div className="space-y-1 text-center">
            <div className={`mx-auto flex items-center justify-center transition-all ${
              isRegister ? "w-8 h-8" : "w-10 h-10"
            }`}>
              <img src={logoSakti} alt="Logo SAKTI" className="object-contain w-full h-full" />
            </div>
            <h2 className={`font-bold text-gray-800 tracking-tight transition-all ${
              isRegister ? "text-xl pt-0.5" : "text-2xl pt-1"
            }`}>
              {isRegister ? "Buat Akun Baru" : "Selamat Datang"}
            </h2>
            <p className="text-xs font-medium text-gray-400">
              {isRegister ? "Silahkan daftar untuk menikmati layanan Chatbot" : "Silahkan masuk ke layanan Chatbot"}
            </p>
          </div>

          {/* ERROR BOX */}
          {error && (
            <div className="px-3 py-2 text-xs font-semibold text-center text-red-600 border border-red-200 bg-red-50 rounded-xl">
              {error}
            </div>
          )}

          {/* 📝 FORM FIELD */}
          <form className={isRegister ? "space-y-2.5" : "space-y-4"} onSubmit={handleSubmit}>
            
            {/* INPUT FIELD NAMA (Hanya saat Register) */}
            {isRegister && (
              <div className="space-y-1 text-left">
                <label className="block text-xs font-bold tracking-wide text-gray-600">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white text-gray-800 font-medium placeholder:text-gray-400"
                    placeholder="Masukkan nama sesuai KTP"
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            {/* INPUT FIELD EMAIL */}
            <div className="space-y-1 text-left">
              <label className="block text-xs font-bold tracking-wide text-gray-600">
                Email Valid
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
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 focus:bg-white text-gray-800 font-medium placeholder:text-gray-400 transition-all ${
                    isRegister ? "py-2.5" : "py-3"
                  }`}
                  placeholder="Masukkan email aktif"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* INPUT FIELD PASSWORD */}
            <div className="space-y-1 text-left">
              <label className="block text-xs font-bold tracking-wide text-gray-600">
                Kata Sandi
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
                  className={`w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-10 text-sm focus:outline-none focus:border-blue-500 focus:bg-white text-gray-800 font-medium placeholder:text-gray-400 transition-all ${
                    isRegister ? "py-2.5" : "py-3"
                  }`}
                  placeholder="Masukkan kata sandi"
                  required
                  disabled={loading}
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

            {/* INPUT FIELD KONFIRMASI PASSWORD (Hanya saat Register) */}
            {isRegister && (
              <div className="space-y-1 text-left">
                <label className="block text-xs font-bold tracking-wide text-gray-600">
                  Konfirmasi Kata Sandi
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
                    className="w-full bg-gray-50 border border-gray-300 rounded-xl pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white text-gray-800 font-medium placeholder:text-gray-400"
                    placeholder="Ulangi kata sandi"
                    required
                    disabled={loading}
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
            )}

            {/* Cuma muncul saat isRegister bernilai false (Mode Login) */}
            {!isRegister && (
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-[10px] text-blue-600 font-bold hover:underline">
                  Lupa Password?
                </Link>
              </div>
            )}

            {/* 🔘 TOMBOL ACTIONS SUBMIT */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex justify-center items-center gap-2 disabled:opacity-70 ${
                isRegister ? "py-3 mt-1" : "py-4 mt-3"
              }`}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 mr-2 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Memproses...
                </>
              ) : isRegister ? (
                "Daftar Sekarang"
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* 🔗 NAVIGASI TEXT */}
          <div className={`text-center text-xs transition-all ${isRegister ? "pt-0.5" : "pt-2"}`}>
            <span className="font-semibold text-gray-500">
              {isRegister ? "Sudah punya akun? " : "Belum punya akun? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="inline p-0 font-extrabold text-blue-600 transition bg-transparent border-none hover:underline"
            >
              {isRegister ? "Masuk di sini" : "Daftar di sini"}
            </button>
          </div>

          {/* FOOTER */}
          <p className={`text-center text-[10px] text-gray-400 font-bold transition-all ${isRegister ? "pt-0" : "pt-2"}`}>
            2026 Dinas Kependudukan dan Pencatatan Sipil Sidoarjo
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginUser;