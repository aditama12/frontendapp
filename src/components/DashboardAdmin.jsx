import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0 });
  const [incomingChats, setIncomingChats] = useState([]);

  // 👉 STATE BUAT MODAL DETAIL CHAT (Sama kaya di Riwayat)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await api.get("/api/mimin/dashboard");
        if (response.data.success) {
          setStats(response.data.data.metrics);
          setIncomingChats(response.data.data.recent_chats);
        }
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 👉 FUNGSI BUAT BUKA MODAL
  const handleOpenDetail = async (chatId) => {
    setIsModalOpen(true);
    setLoadingDetail(true);
    setSelectedDetail(null); 
    
    try {
      const response = await api.get(`/api/mimin/chats/${chatId}`);
      if (response.data.success) {
        setSelectedDetail(response.data.data);
      }
    } catch (error) {
      console.error("Gagal mengambil detail chat:", error);
      alert("Gagal memuat detail chat!");
    } finally {
      setLoadingDetail(false);
    }
  };

  // 👉 FUNGSI BUAT TUTUP MODAL
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDetail(null);
  };

  const metrics = [
    {
      name: "Total Chat",
      value: stats.total,
      color: "bg-blue-50 text-blue-600",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
        </svg>
      ),
    },
    {
      name: "Menunggu Balasan",
      value: stats.pending,
      color: "bg-amber-50 text-amber-600",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      ),
    },
    {
      name: "Chat Selesai",
      value: stats.resolved,
      color: "bg-emerald-50 text-emerald-600",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
          <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-8 relative">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-sm text-gray-400">Ringkasan Aktivitas SAKTI Hari Ini</p>
      </div>

      {/* METRIC GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((m, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6">
            <div className={`w-14 h-14 ${m.color} rounded-full flex items-center justify-center text-2xl font-bold`}>
              {m.icon}
            </div>
            <div className="space-y-1">
              <span className="text-sm text-gray-400 font-medium">{m.name}</span>
              <p className="text-3xl font-bold text-gray-800">
                {loading ? "..." : m.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* TABLE DATA CONTAINER */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800">Pesan Masuk Terbaru</h3>
          {loading && <span className="text-sm text-gray-400 animate-pulse">Memuat data...</span>}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/70 text-gray-400 text-xs font-semibold uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Pesan Terakhir</th>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-600">
              {incomingChats.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    Belum ada obrolan yang dialihkan ke admin.
                  </td>
                </tr>
              ) : (
                incomingChats.map((chat) => (
                  <tr key={chat.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-800">{chat.user}</td>
                    <td className="px-6 py-4 max-w-xs truncate">{chat.message}</td>
                    <td className="px-6 py-4 text-gray-400">
                      {new Date(chat.time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        chat.status === 'pending' 
                          ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {chat.status === 'pending' ? 'Menunggu' : 'Selesai'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {/* 👉 LOGIKA TOMBOL DINAMIS */}
                      {chat.status === 'pending' ? (
                        <button 
                            onClick={() => navigate("/mimin/chat")}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-md shadow-blue-600/10 transition-all"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                            </svg>
                            Balas Chat
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleOpenDetail(chat.id)}
                          className="border border-gray-200 hover:border-blue-500 text-gray-700 hover:text-blue-600 hover:bg-blue-50 text-xs font-semibold px-4 py-2 rounded-xl transition-all inline-flex items-center gap-2"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                          Lihat Detail
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 bg-gray-50/50 text-center border-t border-gray-50">
          <button 
            onClick={() => navigate("/mimin/chat")}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors inline-flex items-center gap-1"
          >
            Lihat semua antrean &rarr;
          </button>
        </div>
      </div>

      {/* 👉 MODAL POP-UP DETAIL CHAT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity"
            onClick={handleCloseModal}
          ></div>
          
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col relative z-10 overflow-hidden border border-gray-100 transform transition-all scale-100">
            
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Detail Percakapan</h2>
                <p className="text-xs text-gray-500">Mode Read-Only (Hanya Baca)</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-gray-50/30">
              {loadingDetail ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                   <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-sm text-gray-500 font-medium">Memuat detail percakapan...</span>
                </div>
              ) : selectedDetail ? (
                <>
                  <div>
                    <div className="text-xs text-gray-400 font-semibold mb-2 ml-1">Pertanyaan Awal User</div>
                    <div className="flex justify-start">
                      <div className="bg-gray-200/70 text-gray-800 max-w-xl p-4 rounded-2xl rounded-tl-sm text-sm leading-relaxed border border-gray-200">
                        {selectedDetail.chat.message}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-400 font-semibold mb-2 text-right mr-1">Jawaban AI (SAKTI)</div>
                    <div className="flex justify-end">
                      <div className="bg-blue-50 text-blue-900 border border-blue-100 max-w-xl p-4 rounded-2xl rounded-tr-sm text-sm leading-relaxed">
                        {selectedDetail.chat.bot_reply}
                      </div>
                    </div>
                  </div>

                  {selectedDetail.chat.escalation_reason && (
                    <div className="flex justify-center my-6">
                      <div className="bg-amber-50 border border-amber-100 text-amber-800 px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 max-w-md text-center shadow-sm">
                        <span>⚠️ Dialihkan ke Admin karena: {selectedDetail.chat.escalation_reason}</span>
                      </div>
                    </div>
                  )}

                  {selectedDetail.all_messages && selectedDetail.all_messages.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-400 font-semibold mb-4 text-center">--- Lanjutan Percakapan ---</div>
                      <div className="space-y-4">
                        {selectedDetail.all_messages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-xl">
                              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                msg.type === 'admin'
                                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-tr-sm'
                                  : 'bg-gray-200/70 text-gray-800 border border-gray-200 rounded-tl-sm'
                              }`}>
                                {msg.message}
                              </div>
                              <p className={`text-[10px] text-gray-400 mt-1 ${msg.type === 'admin' ? 'text-right' : 'text-left'}`}>
                                {msg.type === 'admin' ? `Admin: ${msg.admin_name}` : 'User'} • {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-400 py-10">Data tidak ditemukan.</div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={handleCloseModal}
                className="bg-gray-800 hover:bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}