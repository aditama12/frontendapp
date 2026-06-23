import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logoSakti from "../assets/logoBlue.png";
import api from "../services/api";

export default function LoginAdmin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await api.post("/api/mimin/login", {
        email: email,
        password: password,
        role: "admin",
      });

      if (response.status === 200 || response.status === 201) {
        // Simpan token yang didapat dari Laravel ke localStorage
        localStorage.setItem("auth_token", response.data.token);
        navigate("/mimin/dashboard");
      }
    } catch (error) {
      setErrorMessage(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen px-4 overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800">
      {/* Ornamen Ombak Estetik Khas Mockup */}
      <div className="absolute inset-y-0 right-0 w-1/3 origin-top-right transform skew-x-12 pointer-events-none bg-white/5" />
      <div className="absolute rounded-full pointer-events-none -bottom-20 -left-20 w-80 h-80 bg-blue-500/30 blur-3xl" />

      {/* Card Login Box */}
      <div className="max-w-md w-full bg-white bg-clip-padding border-[12px] border-white/30 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 space-y-8 relative z-10">
        <div className="space-y-3 text-center">
          {/* Logo SAKTI Sidoarjo */}
          <div className="flex items-center justify-center w-10 h-10 mx-auto transition-transform duration-300 transform hover:-translate-y-1">
            <img
              src={logoSakti}
              alt="Logo SAKTI"
              className="object-contain w-full h-full"
            />
          </div>
          <h2 className="pt-2 text-2xl font-bold tracking-tight text-gray-800">
            Selamat Datang
          </h2>
          <p className="text-sm text-gray-400">
            Silahkan masuk untuk melanjutkan pengolahan data
          </p>
        </div>

        {/* Tempat Menampilkan Pesan Error */}
        {errorMessage && (
          <div className="px-4 py-3 text-sm font-medium text-center text-red-600 border border-red-200 bg-red-50 rounded-xl">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold tracking-wide text-gray-500">
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206"
                  />
                </svg>
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-4 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-700 disabled:opacity-50"
                placeholder="Masukkan email dinas"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold tracking-wide text-gray-500">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-12 pr-12 py-3.5 text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-700 disabled:opacity-50"
                placeholder="Masukkan password"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                {showPassword ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-4 text-sm shadow-xl shadow-blue-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 mt-2 flex justify-center items-center gap-2 disabled:opacity-70 disabled:hover:translate-y-0"
          >
            {isLoading ? (
              <>
                <svg
                  className="w-5 h-5 mr-2 -ml-1 text-white animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </button>
        </form>

        <p className="text-xs font-medium text-center text-gray-400">
          2026 Dinas Kependudukan dan Pencatatan Sipil Sidoarjo
        </p>
      </div>
    </div>
  );
}