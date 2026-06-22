import { useState, useEffect } from "react";
import api from "../services/api";

export default function RiwayatChat() {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // 👉 STATE BUAT PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 7; // Menampilkan 7 data per halaman sesuai gambar

  // STATE BUAT MODAL DETAIL CHAT
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get("/api/mimin/history");
        if (response.data.success) {
          setHistoryList(response.data.data);
        }
      } catch (error) {
        console.error("Gagal mengambil riwayat chat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Reset ke halaman 1 setiap kali admin ngetik di kotak pencarian
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDetail(null);
  };

  // 👉 LOGIKA PENCARIAN & PAGINATION
  const filteredHistory = historyList.filter(chat =>
    (chat.user_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chat.message || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredHistory.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  
  // Potong array data buat ditampilin di halaman saat ini aja
  const currentItems = filteredHistory.slice(indexOfFirstItem, indexOfLastItem);

  // Bikin logika susunan angka pagination (1 2 3 ... 21)
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-6 relative">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Riwayat Chat</h1>
        <p className="text-sm text-gray-400">Lihat semua percakapan yang telah selesai</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* PENCARIAN */}
        <div className="p-4 border-b border-gray-50">
          <div className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Cari pengguna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
          </div>
        </div>

        {/* TABEL DATA */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-xs font-bold uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Ditangani Oleh</th>
                <th className="px-6 py-4">Selesai Pada</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-sm text-gray-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400 animate-pulse">
                    Memuat riwayat percakapan...
                  </td>
                </tr>
              ) : currentItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-400">
                    Tidak ada riwayat chat.
                  </td>
                </tr>
              ) : (
                currentItems.map((chat) => {
                  const ditanganiOleh = chat.status === 'resolved' || chat.status === 'pending' ? 'Admin' : 'AI';
                  const tanggal = new Date(chat.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                  
                  return (
                    <tr key={chat.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-800">{chat.user_name}</td>
                      <td className="px-6 py-4 text-gray-600">Ditangani Oleh {ditanganiOleh}</td>
                      <td className="px-6 py-4 text-gray-600">{tanggal}</td>
                      
                      {/* 👉 INI BAGIAN STATUS YANG DIBENERIN WKWK */}
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                          chat.status === 'resolved' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : chat.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {chat.status === 'resolved' ? 'Selesai' : (chat.status === 'pending' ? 'Menunggu' : 'Selesai (AI)')}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => handleOpenDetail(chat.id)}
                          className="border border-gray-200 hover:border-blue-500 text-blue-600 font-semibold px-4 py-1.5 rounded-lg transition-all text-xs shadow-sm"
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* 👉 PAGINATION CONTROLS */}
        {!loading && filteredHistory.length > 0 && (
          <div className="p-4 bg-white border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-gray-500 font-medium">
              Menampilkan {indexOfFirstItem + 1} - {Math.min(indexOfLastItem, totalItems)} dari {totalItems} chat
            </span>
            <div className="flex items-center gap-1.5 text-xs font-medium">
              <button 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &lt;
              </button>
              
              {getPageNumbers().map((num, i) => (
                <button
                  key={i}
                  onClick={() => typeof num === 'number' && setCurrentPage(num)}
                  disabled={num === '...'}
                  className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                    currentPage === num 
                      ? "bg-blue-600 text-white shadow-sm border-blue-600" 
                      : num === '...' 
                        ? "text-gray-400 cursor-default" 
                        : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {num}
                </button>
              ))}

              <button 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="w-8 h-8 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>

      {/* MODAL POP-UP DETAIL CHAT */}
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