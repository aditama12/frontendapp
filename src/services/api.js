import axios from "axios";

// 🚀 TAMBAHKAN FALLBACK RAILWAY DISINI
const API_URL = import.meta.env.VITE_API_URL || "https://chatbotapp-production-d5b3.up.railway.app";

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Otomatis selipkan token kalau ada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 422) {
      return Promise.reject(error.response.data.message || "Email atau password yang Anda masukkan salah.");
    }

    if (error.response?.status === 401) {
      if (error.config?.url?.includes("/login")) {
        return Promise.reject("Email atau kata sandi yang Anda masukkan salah.");
      }
      localStorage.removeItem("auth_token");
      localStorage.removeItem("user");
      return Promise.reject("Sesi Anda telah habis atau belum login.");
    }

    if (error.response?.status >= 500) {
      return Promise.reject("Server sedang gangguan. Coba lagi nanti.");
    }

    if (!error.response) {
      return Promise.reject("Tidak bisa terhubung ke server. Cek koneksi internet Anda.");
    }

    return Promise.reject(error.response.data.message || "Terjadi kesalahan tidak terduga.");
  }
);

export default api;