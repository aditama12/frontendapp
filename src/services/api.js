import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // 👈 Kembalikan seperti ini
  timeout: 10000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// (Biarkan interceptor-nya tetap utuh, sudah sangat bagus!)
export default api;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Tangani error 422 (Validasi Form)
    if (error.response?.status === 422) {
      return Promise.reject(
        error.response.data.message ||
          "Email atau password yang Anda masukkan salah.",
      );
    }

    // Tangani error 401 (Unauthorized / Kredensial Salah)
    if (error.response?.status === 401) {
      // Jika error 401 terjadi SAAT proses login, tampilkan pesan salah password
      if (error.config?.url?.includes("/login")) {
        return Promise.reject(
          "Email atau kata sandi yang Anda masukkan salah.",
        );
      }
      return Promise.reject("Sesi Anda telah habis atau belum login.");
    }

    // Tangani error 419 (CSRF Token Mismatch)
    if (error.response?.status === 419) {
      return Promise.reject(
        "Token kedaluwarsa (419). Silakan refresh halaman dan coba lagi.",
      );
    }

    // Error 500 dan lainnya
    if (error.response?.status >= 500) {
      return Promise.reject("Server sedang gangguan. Coba lagi nanti.");
    }

    if (!error.response) {
      return Promise.reject(
        "Tidak bisa terhubung ke server. Cek koneksi internet Anda.",
      );
    }

    return Promise.reject(
      error.response.data.message || "Terjadi kesalahan tidak terduga.",
    );
  },
);

export default api;
