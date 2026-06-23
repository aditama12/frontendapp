import { useState, useEffect, useRef } from "react";
import api from "../services/api";

export default function ChatAdmin() {
  const [activeChat, setActiveChat] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [chatDetail, setChatDetail] = useState(null);
  const [replyText, setReplyText] = useState("");
  
  // State loading untuk tombol dan skeleton awal
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [lastViewed, setLastViewed] = useState({});

  const chatListRef = useRef([]);
  const activeChatRef = useRef(null);
  const replyTextRef = useRef("");

  useEffect(() => { activeChatRef.current = activeChat; }, [activeChat]);
  useEffect(() => { replyTextRef.current = replyText; }, [replyText]);

  // 👉 PERBAIKAN UX: Fungsi ini dijalankan SEKETIKA saat admin klik list chat
  const handleSelectChat = (chat) => {
    if (activeChat?.id === chat.id) return; // Abaikan jika klik chat yang sama
    
    setActiveChat(chat);
    setChatDetail(null); // INSTAN mengosongkan layar kanan agar spinner Loading langsung muncul!
    
    loadChatDetail(chat.id, false);
    setLastViewed(prev => ({ ...prev, [chat.id]: Date.now() }));
  };

useEffect(() => {
    let isMounted = true;
    let timer = null;

    const pollData = async (isFirstTime = false) => {
      if (!isMounted) return;

      try {
        if (!replyTextRef.current.trim()) {
          await loadEscalatedChats(isFirstTime); 

          // Refresh isi chat yang lagi dibuka (Silent background mode)
          if (activeChatRef.current?.id) {
            await loadChatDetail(activeChatRef.current.id, true);
          }
        }
      } catch (err) {
        console.error("Polling tertunda:", err);
      } finally {
        if (isMounted) {
          if (isFirstTime) setInitialLoad(false); // Matikan skeleton loading kiri
          // 👇 SUDAH DIGANTI: Jeda ditambah jadi 4 detik biar aplikasi stabil
          timer = setTimeout(() => pollData(false), 4000);
        }
      }
    };

    pollData(true);

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

    const pollData = async (isFirstTime = false) => {
      if (!isMounted) return;

      if (!replyTextRef.current.trim()) {
        await loadEscalatedChats(isFirstTime); 

        // Refresh isi chat yang lagi dibuka (Silent background mode)
        if (activeChatRef.current?.id) {
          await loadChatDetail(activeChatRef.current.id, true);
        }
      }

      if (isMounted) {
        if (isFirstTime) setInitialLoad(false); // Matikan skeleton loading kiri
        timer = setTimeout(() => pollData(false), 3000);
      }
    };

    pollData(true);

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []); 

  const loadEscalatedChats = async (isFirstTime = false) => {
    try {
      const response = await api.get("/api/mimin/chats/escalated");
      if (response.data.success) {
        const newData = response.data.data;
        const dataChanged = JSON.stringify(chatListRef.current) !== JSON.stringify(newData);
        
        if (dataChanged) {
          chatListRef.current = newData;
          setChatList(newData);
          
          // 👉 Otomatis buka chat pertama SAAT LAYAR KANAN KOSONG (Tanpa Delay)
          if (!activeChatRef.current && newData.length > 0) {
            const firstChat = newData[0];
            setActiveChat(firstChat);
            loadChatDetail(firstChat.id, false); 
          }
        }
      }
    } catch (err) {
      if (isFirstTime) console.error("Error loading escalated chats:", err);
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
      const response = await api.post(`/api/mimin/chats/${activeChat.id}/reply`, {
        message: replyText
      });

      if (response.data.success) {
        setReplyText("");
        await loadChatDetail(activeChat.id, true); // Silent refresh biar nggak kedip
        await loadEscalatedChats(false);
      }
    } catch (err) {
      console.error("Error sending reply:", err);
      alert("Gagal mengirim pesan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const handleResolveChat = async () => {
    if (!activeChat?.id) return;

    try {
      setLoading(true);
      const response = await api.post(`/api/mimin/chats/${activeChat.id}/resolve`);

      if (response.data.success) {
        await loadChatDetail(activeChat.id, true);
        await loadEscalatedChats(false);
      }
    } catch (err) {
      console.error("Error resolving chat:", err);
      alert("Gagal menyelesaikan chat. Sistem lagi sibuk!");
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
          {initialLoad ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-3 text-sm text-center text-gray-400">
              <svg className="w-6 h-6 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Memuat antrean...</span>
            </div>
          ) : filteredChatList.length === 0 ? (
            <div className="p-6 text-sm text-center text-gray-400">
              Tidak ada chat yang menunggu
            </div>
          ) : (
            filteredChatList.map((chat) => {
              const chatLastUpdated = new Date(chat.escalated_at).getTime();
              const viewedAt = lastViewed[chat.id] || 0;
              const isUnread = chat.status === 'pending' && activeChat?.id !== chat.id && chatLastUpdated > viewedAt;

              return (
                <div
                  key={chat.id}
                  onClick={() => handleSelectChat(chat)}
                  className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                    activeChat?.id === chat.id ? "bg-blue-50/60" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-center flex-shrink-0 text-sm font-semibold text-white rounded-full shadow-sm w-11 h-11 bg-gradient-to-br from-blue-400 to-blue-600">
                    {chat.user_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <h4 className="text-sm font-bold text-gray-800 truncate">{chat.user_name}</h4>
                      <span className="text-xs text-gray-400">{new Date(chat.escalated_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{chat.message}</p>
                  </div>
                  {isUnread && (
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full flex-shrink-0 animate-pulse shadow-sm shadow-red-500/50" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: CHAT INTERACTION SPACE */}
      <div className="relative flex flex-col flex-1 bg-gray-50">
        {activeChat ? (
          <>
            {/* HEADER AREA */}
            <div className="relative z-10 flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 font-semibold text-white rounded-full shadow-sm bg-gradient-to-br from-blue-400 to-blue-600">
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
                    className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white transition-all shadow-sm bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 rounded-xl active:scale-95"
                  >
                    Selesaikan Chat
                  </button>
                )}
                {activeChat.status === 'resolved' && (
                  <span className="text-xs bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full font-bold">
                    Telah Diselesaikan
                  </span>
                )}
              </div>
            </div>

            {/* CHAT CONTENT BOX */}
            <div className="flex-1 p-6 space-y-6 overflow-y-auto">
              {!chatDetail ? (
                // 👉 UX SPINNER INSTAN KETIKA PINDAH CHAT
                <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-70">
                   <svg className="w-8 h-8 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <div className="text-sm font-medium text-gray-500">Menyiapkan percakapan...</div>
                </div>
              ) : (
                <>
                  {/* User Original Message */}
                  <div>
                    <div className="mb-2 text-xs font-bold tracking-wider text-gray-400 uppercase">Pertanyaan Awal User</div>
                    <div className="flex justify-start">
                      <div className="max-w-xl p-4 text-sm leading-relaxed text-gray-800 border border-gray-200 rounded-tl-sm bg-gray-200/60 rounded-2xl">
                        {chatDetail.chat.message}
                      </div>
                    </div>
                  </div>

                  {/* Bot Reply */}
                  <div>
                    <div className="mb-2 text-xs font-bold tracking-wider text-right text-gray-400 uppercase">Jawaban Bot AI</div>
                    <div className="flex justify-end">
                      <div className="max-w-xl p-4 text-sm leading-relaxed text-blue-900 border border-blue-100 rounded-tr-sm bg-blue-50 rounded-2xl">
                        {chatDetail.chat.bot_reply}
                      </div>
                    </div>
                  </div>

                  {/* Escalation Notice */}
                  <div className="flex justify-center my-6">
                    <div className="flex items-center max-w-md gap-2 px-4 py-3 text-xs border shadow-sm bg-amber-50 border-amber-100 text-amber-800 rounded-xl">
                      <span className="text-base">⚠️</span>
                      <p>
                        <b>Otomatis dialihkan ke Admin.</b>{' '}
                        {chatDetail.chat.escalation_reason && (
                          <span className="font-medium text-amber-700/80">Alasan: {chatDetail.chat.escalation_reason}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Admin & User Follow-up Messages */}
                  {chatDetail?.all_messages && chatDetail.all_messages.length > 0 && (
                    <div>
                      <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gray-200"></div>
                        <div className="text-xs font-bold tracking-wider text-gray-400 uppercase">Lanjutan Percakapan</div>
                        <div className="flex-1 h-px bg-gray-200"></div>
                      </div>
                      
                      <div className="space-y-4">
                        {chatDetail.all_messages.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.type === 'admin' ? 'justify-end' : 'justify-start'}`}>
                            <div className="max-w-xl">
                              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                msg.type === 'admin'
                                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-tr-sm'
                                  : 'bg-white text-gray-800 border border-gray-200 rounded-tl-sm'
                              }`}>
                                {msg.message}
                              </div>
                              <p className={`text-[10px] text-gray-400 mt-1 font-medium ${msg.type === 'admin' ? 'text-right' : 'text-left'}`}>
                                {msg.type === 'admin' ? msg.admin_name : 'User'} • {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* FOOTER INPUT BOX */}
            {chatDetail?.chat.status === 'pending' && (
              <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.02)] z-10 relative">
                <form onSubmit={handleSendReply} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Ketik Jawaban Anda..."
                    disabled={loading || !chatDetail}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-800 rounded-xl px-5 py-3.5 text-sm focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all disabled:bg-gray-100 disabled:opacity-70"
                  />
                  <button
                    type="submit"
                    disabled={!replyText.trim() || loading || !chatDetail}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 text-white rounded-xl px-6 py-3.5 font-bold text-sm transition-all flex items-center gap-2 flex-shrink-0 shadow-md shadow-blue-600/20 active:scale-95"
                  >
                    <span>Kirim</span>
                    <svg className="w-4 h-4 transform rotate-45 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                  </button>
                </form>
              </div>
            )}

            {chatDetail?.chat.status === 'resolved' && (
              <div className="relative z-10 p-4 text-sm font-medium text-center text-gray-500 bg-gray-100 border-t border-gray-200">
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  Percakapan ini telah dikunci dan diselesaikan.
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 bg-gray-50">
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full shadow-inner">
                <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-gray-500">Tidak ada chat yang terbuka</p>
              <p className="max-w-xs mx-auto mt-1 text-sm leading-relaxed text-gray-400">
                Pilih pengguna dari daftar di sebelah kiri untuk melihat detail atau membalas pesan.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}