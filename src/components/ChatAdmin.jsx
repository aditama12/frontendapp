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

  // Polling effect: Menggunakan Rekursif setTimeout dengan deteksi Tarikan Pertama (Auto-open)
  useEffect(() => {
    let isMounted = true;
    let timer = null;

    const pollData = async (isFirstTime = false) => {
      if (!isMounted) return;

      // Pause narik data dari server JIKA admin lagi asik ngetik, biar ketikannya gak putus
      if (!replyTextRef.current.trim()) {
        // Jika ini tarikan pertama, silent = false (agar chat auto-select). Jika bukan, silent = true.
        await loadEscalatedChats(!isFirstTime); 
        
        // Refresh isi chat yang lagi dibuka
        if (activeChatRef.current?.id) {
          await loadChatDetail(activeChatRef.current.id, true);
        }
      }

      // Jadwalkan request berikutnya HANYA SETELAH request saat ini selesai
      if (isMounted) {
        timer = setTimeout(() => pollData(false), 3000);
      }
    };

    // Jalankan pertama kali saat halaman dibuka dengan flag isFirstTime = true
    pollData(true);

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
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
      // Kita redam error log jika sedang berjalan di background agar console tetap bersih
      if (!silent) console.error("Error loading escalated chats:", err);
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
      if (!silent) console.error("Error loading chat detail:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyText.trim() || !activeChat?.id) return;

    try {
      setLoading(true);
      
      // Langsung tembak API (Tidak perlu get csrf-cookie karena kita pakai mode Stateless API Token)
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
      
      // Langsung tembak API (Tidak perlu get csrf-cookie)
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
      <div className="flex flex-col border-r border-gray-200 w-80 bg-gray-50/40">
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
            <span className="absolute inset-y-0 flex items-center text-gray-400 left-3">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
          </div>
        </div>

        {/* LIST HOLDER */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {filteredChatList.length === 0 ? (
            <div className="p-4 text-sm text-center text-gray-400">
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
                  <div className="flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white rounded-full w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600">
                    {chat.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-sm font-semibold text-gray-800 truncate">{chat.user_name}</h4>
                      <span className="text-xs text-gray-400">{new Date(chat.escalated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{chat.message}</p>
                  </div>
                  {/* Titik merah cuma muncul kalau isUnread == true */}
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
      <div className="flex flex-col flex-1 bg-gray-50">
        {activeChat ? (
          <>
            {/* HEADER AREA */}
            <div className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 font-semibold text-white rounded-full bg-gradient-to-br from-blue-400 to-blue-600">
                  {activeChat.user_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-800">{activeChat.user_name}</h3>
                  <span className="text-xs text-gray-500">{activeChat.user_email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeChat.status === 'pending' && (
                  <button
                    onClick={handleResolveChat}
                    disabled={loading}
                    className="px-5 py-2 text-sm font-semibold text-white transition-colors bg-green-600 hover:bg-green-700 disabled:bg-gray-300 rounded-xl"
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
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {loading && !chatDetail ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-gray-400">Memuat chat...</div>
                </div>
              ) : chatDetail ? (
                <>
                  {/* User Original Message */}
                  <div>
                    <div className="mb-2 text-xs font-semibold text-gray-400">Pertanyaan User</div>
                    <div className="flex justify-start">
                      <div className="max-w-xl p-4 text-sm leading-relaxed text-gray-800 bg-gray-100 rounded-tl-none rounded-2xl">
                        {chatDetail.chat.message}
                      </div>
                    </div>
                  </div>

                  {/* Bot Reply */}
                  <div>
                    <div className="mb-2 text-xs font-semibold text-gray-400">Jawaban Bot</div>
                    <div className="flex justify-end">
                      <div className="max-w-xl p-4 text-sm leading-relaxed text-gray-800 border border-blue-100 rounded-tr-none bg-blue-50 rounded-2xl">
                        {chatDetail.chat.bot_reply}
                      </div>
                    </div>
                  </div>

                  {/* Escalation Notice */}
                  <div className="flex justify-center">
                    <div className="flex items-center max-w-md gap-2 px-4 py-3 text-xs border bg-amber-50 border-amber-100 text-amber-800 rounded-xl">
                      <span>⚠️</span>
                      <p>
                        <b>Sistem:</b> Pertanyaan dialihkan ke Admin.{' '}
                        {chatDetail.chat.escalation_reason && (
                          <span>Alasan: {chatDetail.chat.escalation_reason}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Admin & User Follow-up Messages */}
                  {chatDetail?.all_messages && chatDetail.all_messages.length > 0 && (
                    <div>
                      <div className="mb-3 text-xs font-semibold text-gray-400">Percakapan Admin & User</div>
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

            {/* FOOTER INPUT BOX */}
            {chatDetail?.chat.status === 'pending' && (
              <div className="p-4 bg-white border-t border-gray-100">
                <form onSubmit={handleSendReply} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Ketik Jawaban..."
                    disabled={loading}
                    className="w-full px-4 py-3 text-sm text-gray-800 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:bg-white disabled:bg-gray-100"
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
              <div className="p-4 text-sm font-medium text-center text-green-700 border-t border-green-100 bg-green-50">
                Chat ini sudah ditutup dan dijawab oleh admin
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 bg-gray-50">
            <div className="text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <p className="font-medium text-gray-500">Tidak ada chat yang menunggu</p>
              <p className="mt-1 text-sm text-gray-400">Chat dari user akan otomatis muncul di sini</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}