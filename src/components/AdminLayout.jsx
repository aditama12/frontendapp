import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../services/api"; 
import logoSakti from "../assets/logo.png";

export default function AdminLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Kasih nilai default yang aman
  const [admin, setAdmin] = useState({ name: "Loading...", email: "" });

  useEffect(() => {
    api.get('/api/user')
      .then(res => {
        // 👇 PASANG CONSOLE LOG DI SINI BUB 👇
        console.log("Mata-mata data dari backend:", res.data); 
        
        const userData = res.data?.data || res.data?.user || res.data;
        
        // Kalau ternyata di database kamu pakai 'nama' bukan 'name', ubah juga di sini ya:
        if (userData && (userData.name || userData.nama)) {
          // setAdmin dengan data yang didapat
          setAdmin({ ...userData, name: userData.name || userData.nama });
        }
      })
      .catch(err => {
        // 👇 INTIP JUGA KALAU ADA ERROR 👇
        console.error("Waduh, gagal narik data nih bub:", err);
      });
  }, []);

  const getInitials = (name) => {
    if (!name || name === "Loading...") return "A";
    const words = name.split(" ");
    return words.length > 1 ? (words[0][0] + words[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  const menuItems = [
    {
      name: "Dashboard",
      path: "/mimin/dashboard",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
    },
    {
      name: "Antrean Chat",
      path: "/mimin/chat",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ),
    },
    {
      name: "Riwayat",
      path: "/mimin/riwayat",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* SIDEBAR AREA */}
      <aside 
        className={`bg-[#001b4e] text-white flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "w-54" : "w-24"
        }`}
      >
        <div className={`p-6 h-16 flex items-center border-b border-blue-900/50 ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
          {/* Logo SAKTI & Toggle Klik */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Buka/Tutup Menu"
          >
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center transform group-hover:scale-105 transition-transform">
              {/* Tambahin string kosong sementara biar gak error kalau path logoSakti belum diisi */}
              <img src={logoSakti || ""} alt="Logo SAKTI" className="w-full h-full object-contain" />
            </div>
            {/* Teks SAKTI hanya muncul jika sidebar open */}
            {isSidebarOpen && (
              <span className="text-xl font-bold tracking-wider transition-opacity duration-300">
                SAKTI
              </span>
            )}
          </div>
          
          {/* Ikon Menu (Hamburger) */}
          {isSidebarOpen && (
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          )}
        </div>

        {/* LIST NAVIGASI MENU */}
        <nav className="flex-1 px-4 py-6 space-y-3 overflow-hidden">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                title={!isSidebarOpen ? item.name : ""}
                className={`flex items-center rounded-xl transition-all duration-200 ${
                  isSidebarOpen ? "gap-4 px-4 py-3.5" : "justify-center p-3.5"
                } ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-gray-400 hover:bg-blue-950/50 hover:text-white"
                }`}
              >
                <div className="flex-shrink-0">
                  {item.icon}
                </div>
                {isSidebarOpen && (
                  <span className="text-[13px] font-medium whitespace-nowrap">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* TOMBOL KELUAR */}
        <div className="p-4 border-t border-blue-900/50">
          <button 
            onClick={() => navigate("/mimin/login")}
            title={!isSidebarOpen ? "Keluar Sistem" : ""}
            className={`flex items-center text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-200 ${
              isSidebarOpen ? "w-full gap-3 px-4 py-3 text-sm font-medium" : "justify-center p-3"
            }`}
          >
            <div className="flex-shrink-0">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            {isSidebarOpen && <span className="whitespace-nowrap">Keluar Sistem</span>}
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div 
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isSidebarOpen ? "pl-54" : "pl-24"
        }`}
      >
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-8 sticky top-0 z-40">
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="text-right">
              {/* Tambahkan ?. (Optional Chaining) biar nggak error kalau name-nya kosong sesaat */}
              <p className="text-sm font-semibold text-gray-800 uppercase">{admin?.name || "Admin"}</p>
              <p className="text-xs text-gray-400">Admin Disdukcapil</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-400 to-blue-500 flex items-center justify-center font-bold text-white shadow-inner">
              {getInitials(admin?.name)}
            </div>
          </div>
        </header>

        {/* PAGE INJECTOR */}
        <main className="p-8 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}