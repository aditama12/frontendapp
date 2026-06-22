import { useState, useEffect, useRef } from "react";
import api from "../services/api";

export default function ChatAdmin() {
  const [activeChat, setActiveChat] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [chatDetail, setChatDetail] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // State baru buat ngetrack kapan terakhir admin ngebuka/ngebaca chatnya
  const [lastViewed, setLastViewed] = useState({});

  // Gunakan Ref biar nilai terbaru bisa dibaca diam-diam tanpa bikin komponen nge-render berulang kali
  const chatListRef = useRef([]);
  const pollingIntervalRef = useRef(null);
  const activeChatRef = useRef(null);
  const replyTextRef = useRef("");

  // Update nilai Ref tiap kali ada state yang berubah
  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { replyTextRef.current = replyText; }, [replyText]);

  // Load chat detail saat admin milih chat di sidebar, sekalian catat waktu bacanya
  useEffect(() => {
    if (activeChat?.id) {
      loadChatDetail(activeChat.id);
      setLastViewed(prev => ({ ...prev, [activeChat.id]: Date.now() }));
    }
  }, [activeChat]);

  // Update waktu baca saat chat detail di-refresh otomatis
  useEffect(() => {
    if (activeChat?.id && chatDetail) {
      setLastViewed(prev => ({ ...prev, [activeChat.id]: Date.now() }));
    }
  }, [chatDetail, activeChat]);

  // Polling effect: Dijalankan SEKALI SAJA saat halaman dibuka
  useEffect(() => {
    loadEscalatedChats();

    pollingIntervalRef.current = setInterval(() => {
      // Pause narik data dari server JIKA admin lagi asik ngetik, biar ketikannya gak putus
      if (replyTextRef.current.trim()) {
        return;
      }

      loadEscalatedChats(true);

      // Refresh isi chat yang lagi dibuka
      if (activeChatRef.current?.id) {
        loadChatDetail(activeChatRef.current.id, true);
      }
    }, 3000);

    return () => clearInterval(pollingIntervalRef.current);
  }, []); 

  const loadEscalatedChats = async (silent = false) => {
    try {
      const response = await api.get("/api/mimin/chats/escalated");
      if (response.data.success) {
        const newData = response.data.data;
        const dataChanged = JSON.stringify(chatListRef.current) !== JSON.stringify(newData);
        
        if (dataChanged) {
          chatListRef.current = newData;
          setChatList(newData);
          
          if (!silent && !activeChatRef.current && newData.length > 0) {
            setActiveChat(newData[0]);
          }
        }
      }
    } catch (err) {
      console.error("Error loading escalated chats:", err);
    }
  };

  const loadChatDetail = async (chatId, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await api.get(`/api/mimin/chats/${chatId}`);
      if (response.data.success) {
        setChatDetail(response.data.data);
      }
    } catch (err) {
      console.error("Error loading chat detail:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyText.trim() || !activeChat?.id) return;

    try {
      setLoading(true);
      
      // Pancing token Sanctum
      await api.get("/sanctum/csrf-cookie"); 

      const response = await api.post(`/api/mimin/chats/${activeChat.id}/reply`, {
        message: replyText
      });

      if (response.data.success) {
        setReplyText("");
        // Refresh isi percakapan sama list di sidebar
        await loadChatDetail(activeChat.id);
        await loadEscalatedChats(true);
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Waduh, gagal kirim pesan nih. Coba lagi ya!");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveChat = async () => {
    if (!activeChat?.id) return;

    try {
      setLoading(true);
      
      // Sedia payung token sebelum nyelesaiin chat
      await api.get("/sanctum/csrf-cookie");

      const response = await api.post(`/api/mimin/chats/${activeChat.id}/resolve`);

      if (response.data.success) {
        await loadChatDetail(activeChat.id);
        await loadEscalatedChats();
      }
    } catch (err) {
      console.error("Error resolving chat:", err);
      alert("Gagal menyelesaikan chat. Sistem lagi sibuk kayanya!");
    } finally {
      setLoading(false);
    }
  };

  const filteredChatList = chatList.filter(chat =>
    (chat.user_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (chat.user_email || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="-m-8 h-[calc(100vh-5rem)] flex overflow-hidden bg-white">
      {/* LEFT COLUMN: CHAT LIST */}
      <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/40">
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-bold text-gray-800">Daftar Chat</h2>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari pengguna..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            />
            <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
          </div>
        </div>

        {/* LIST HOLDER */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredChatList.length === 0 ? (
            <div className="p-4 text-center text-gray-400 text-sm">
              Tidak ada chat yang menunggu
            </div>
          ) : (
            filteredChatList.map((chat) => {
              // Logika Titik Merah: Cek apakah chat ini ada pembaruan setelah terakhir dilihat
              const chatLastUpdated = new Date(chat.escalated_at).getTime();
              const viewedAt = lastViewed[chat.id] || 0;
              const isUnread = chat.status === 'pending' && activeChat?.id !== chat.id && chatLastUpdated > viewedAt;

              return (
                <div
                  key={chat.id}
                  onClick={() => setActiveChat(chat)}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                    activeChat?.id === chat.id ? "bg-blue-50/60" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-white font-semibold text-sm">
                    {chat.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-sm font-semibold text-gray-800 truncate">{chat.user_name}</h4>
                      <span className="text-xs text-gray-400">{new Date(chat.escalated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{chat.message}</p>
                  </div>
                  {/* Titik merah sekarang cuma muncul kalau isUnread == true */}
                  {isUnread && (
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0 animate-pulse" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CHAT INTERACTION SPACE */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {activeChat ? (
          <>
            {/* HEADER AREA */}
            <div className="h-16 border-b border-gray-200 bg-white px-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {activeChat.user_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">{activeChat.user_name}</h3>
                  <span className="text-xs text-gray-500">{activeChat.user_email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Tombol Selesaikan Chat dipindah ke Header */}
                {activeChat.status === 'pending' && (
                  <button
                    onClick={handleResolveChat}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-xl px-5 py-2 font-semibold text-sm transition-colors"
                  >
                    Selesaikan Chat
                  </button>
                )}
                {activeChat.status === 'resolved' && (
                  <span className="text-xs bg-green-100 text-green-700 px-3 py-1.5 rounded-full font-medium">
                    Selesai
                  </span>
                )}
              </div>
            </div>

            {/* CHAT CONTENT BOX */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-400">Memuat chat...</div>
                </div>
              ) : chatDetail ? (
                <>
                  {/* User Original Message */}
                  <div>
                    <div className="text-xs text-gray-400 font-semibold mb-2">Pertanyaan User</div>
                    <div className="flex justify-start">
                      <div className="bg-gray-100 text-gray-800 max-w-xl p-4 rounded-2xl rounded-tl-none text-sm leading-relaxed">
                        {chatDetail.chat.message}
                      </div>
                    </div>
                  </div>

                  {/* Bot Reply */}
                  <div>
                    <div className="text-xs text-gray-400 font-semibold mb-2">Jawaban Bot</div>
                    <div className="flex justify-end">
                      <div className="bg-blue-50 text-gray-800 border border-blue-100 max-w-xl p-4 rounded-2xl rounded-tr-none text-sm leading-relaxed">
                        {chatDetail.chat.bot_reply}
                      </div>
                    </div>
                  </div>

                  {/* Escalation Notice */}
                  <div className="flex justify-center">
                    <div className="bg-amber-50 border border-amber-100 text-amber-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2 max-w-md">
                      <span>⚠️</span>
                      <p>
                        <b>Sistem:</b> Pertanyaan dialihkan ke Admin.{' '}
                        {chatDetail.chat.escalation_reason && (
                          <span>Alasan: {chatDetail.chat.escalation_reason}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Admin & User Follow-up Messages (Combined Thread) */}
                  {chatDetail?.all_messages && chatDetail.all_messages.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-400 font-semibold mb-3">Percakapan Admin & User</div>
                      <div className="space-y-3">
                        {chatDetail.all_messages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xl ${msg.type === 'admin' ? '' : ''}`}>
                              <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                                msg.type === 'admin'
                                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-tr-none'
                                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
                              }`}>
                                {msg.message}
                              </div>
                              <p className={`text-[10px] text-gray-400 mt-1 ${msg.type === 'admin' ? 'text-right' : 'text-left'}`}>
                                {msg.type === 'admin' ? msg.admin_name : 'User'} • {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* FOOTER INPUT BOX (Sekarang lebih lega karena tombolnya dipindah ke atas) */}
            {chatDetail?.chat.status === 'pending' && (
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendReply} className="flex gap-3 items-center">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Ketik Jawaban..."
                    disabled={loading}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white disabled:bg-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || loading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-xl px-5 py-3 font-semibold text-sm transition-colors flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span>Kirim</span>
                    <svg className="w-4 h-4 transform rotate-45" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </form>
              </div>
            )}

            {chatDetail?.chat.status === 'resolved' && (
              <div className="p-4 bg-green-50 border-t border-green-100 text-center text-sm text-green-700 font-medium">
                Chat ini sudah ditutup dan dijawab oleh admin
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="text-gray-500 font-medium">Tidak ada chat yang dipilih</p>
              <p className="text-gray-400 text-sm mt-1">Pilih chat dari daftar untuk memulai</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}