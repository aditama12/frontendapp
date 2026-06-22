import { useState, useRef, useEffect } from "react";
import logoSakti from "../assets/logoBlue.png";
import api from "../services/api";

function ChatUser({ onLogout, user }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminReplies, setAdminReplies] = useState({}); 

  const getSavedData = (key, defaultValue) => {
    try {
      const item = localStorage.getItem(`${key}_${user?.id}`);
      return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  const [sessions, setSessions] = useState(() => getSavedData("sessions", []));
  const [activeSessionId, setActiveSessionId] = useState(() => getSavedData("activeSessionId", null));
  const [escalatedChatIds, setEscalatedChatIds] = useState(() => getSavedData("escalatedChatIds", {}));
  const [resolvedChats, setResolvedChats] = useState(() => getSavedData("resolvedChats", {}));
  
  const [chats, setChats] = useState(() => {
    const savedSessions = getSavedData("sessions", []);
    const savedActiveId = getSavedData("activeSessionId", null);
    const currentSession = savedSessions.find(s => s.id === savedActiveId);
    return currentSession ? currentSession.chats : [];
  });

  const chatBodyRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const isUserScrollingRef = useRef(false);

  const handleMobileSidebarClose = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleScroll = () => {
    if (chatBodyRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatBodyRef.current;
      isUserScrollingRef.current = scrollHeight - scrollTop - clientHeight > 100;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (!isUserScrollingRef.current) {
      scrollToBottom();
    }
  }, [chats, loading, adminReplies]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(`sessions_${user.id}`, JSON.stringify(sessions));
      localStorage.setItem(`activeSessionId_${user.id}`, JSON.stringify(activeSessionId));
      localStorage.setItem(`escalatedChatIds_${user.id}`, JSON.stringify(escalatedChatIds));
      localStorage.setItem(`resolvedChats_${user.id}`, JSON.stringify(resolvedChats));
    }
  }, [sessions, activeSessionId, escalatedChatIds, resolvedChats, user?.id]);

  const isCurrentChatEscalated = activeSessionId && escalatedChatIds[activeSessionId];
  const isCurrentChatResolved = activeSessionId && resolvedChats[activeSessionId];

  useEffect(() => {
    if (Object.keys(escalatedChatIds).length === 0) return;
    
    const checkAdminReplies = async () => {
      for (const [sessionId, chatId] of Object.entries(escalatedChatIds)) {
        try {
          const response = await api.get(`/api/mimin/chats/${chatId}`);
          if (response.data.success) {
            const { admin_replies, chat } = response.data.data;
            
            if (chat && chat.status === 'resolved') {
              setResolvedChats(prev => ({ ...prev, [sessionId]: true }));
            }

            if (admin_replies && admin_replies.length > 0) {
              setAdminReplies(prev => ({
                ...prev,
                [chatId]: admin_replies
              }));
            }
          }
        } catch (err) {
          // Silent error
        }
      }
    };
    
    const interval = setInterval(checkAdminReplies, 2000);
    return () => clearInterval(interval);
  }, [escalatedChatIds]);

  const startNewSession = () => {
    const newSession = { id: Date.now(), title: "Obrolan Baru", chats: [] };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setChats([]);
    inputRef.current?.focus();
    isUserScrollingRef.current = false;
    handleMobileSidebarClose(); 
  };

  const selectSession = (session) => {
    setActiveSessionId(session.id);
    setChats(session.chats);
    isUserScrollingRef.current = false;
    handleMobileSidebarClose(); 
  };

  const updateTitle = (sessionId, text) => {
    const title = text.length > 28 ? text.slice(0, 28) + "..." : text;
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, title } : s))
    );
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputMessage.trim() || loading || isCurrentChatResolved) return;

    isUserScrollingRef.current = false; 

    let sessionId = activeSessionId;
    if (!sessionId) {
      const newSession = { id: Date.now(), title: "Obrolan Baru", chats: [] };
      setSessions((prev) => [newSession, ...prev]);
      sessionId = newSession.id;
      setActiveSessionId(sessionId);
    }

    const now = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const msgId = Date.now(); 
    
    const userMsg = { id: msgId, role: "user", text: inputMessage, time: now, status: "sending" };
    
    const updatedChats = [...chats, userMsg];
    setChats(updatedChats);
    
    if (chats.length === 0) updateTitle(sessionId, inputMessage);
    
    setLoading(true);
    const msgToSend = inputMessage;
    setInputMessage("");

    try {
      await api.get("/sanctum/csrf-cookie");

      if (isCurrentChatEscalated) {
        const chatId = escalatedChatIds[sessionId];
        const response = await api.post(`/api/chatbot/escalated/${chatId}/follow-up`, {
          message: msgToSend
        });
        
        if (response.data.success) {
          const finalChats = updatedChats.map(c => c.id === msgId ? { ...c, status: "sent" } : c);
          setChats(finalChats);
          setSessions((prev) =>
            prev.map((s) => (s.id === sessionId ? { ...s, chats: finalChats } : s))
          );
        }
      } else {
        const response = await api.post("/api/chatbot/send", {
          message: msgToSend,
          user_id: user?.id,
        });

        const botTime = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        const botMsg = {
          role: "bot",
          text: response.data.answer || response.data.message || response.data.response || "Maaf, tidak ada jawaban dari chatbot.",
          time: botTime,
        };

        let finalChats = updatedChats.map(c => c.id === msgId ? { ...c, status: "sent" } : c);

        if (response.data.needs_escalation && response.data.chat_id) {
          const escalationMsg = {
            role: "system",
            text: "⚠️ Sistem: Pertanyaan Anda telah dialihkan ke Admin. Harap menunggu tanggapan.",
            time: botTime,
            isEscalated: true
          };
          finalChats = [...finalChats, botMsg, escalationMsg];
          setEscalatedChatIds(prev => ({
            ...prev,
            [sessionId]: response.data.chat_id
          }));
        } else {
          finalChats = [...finalChats, botMsg];
        }

        setChats(finalChats);
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, chats: finalChats } : s))
        );
      }
    } catch (err) {
      const errMsg = {
        role: "bot",
        text: typeof err === "string" ? err : "Gagal terhubung ke server.",
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        isError: true,
      };
      
      const finalChats = updatedChats.map(c => c.id === msgId ? { ...c, status: "failed" } : c).concat(errMsg);
      setChats(finalChats);
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, chats: finalChats } : s))
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeSessionId && escalatedChatIds[activeSessionId]) {
      const chatId = escalatedChatIds[activeSessionId];
      if (adminReplies[chatId] && Array.isArray(adminReplies[chatId])) {
        const adminReplyList = adminReplies[chatId];
        
        setChats(prev => {
          const existingAdminReplies = prev.filter(c => c.isAdminReply);
          if (existingAdminReplies.length < adminReplyList.length) {
            const newAdminReplies = adminReplyList.slice(existingAdminReplies.length);
            const newChats = [...prev];
            
            newAdminReplies.forEach(reply => {
              newChats.push({
                role: "admin",
                text: reply.message,
                time: new Date(reply.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
                isAdminReply: true
              });
            });
            
            return newChats;
          }
          return prev;
        });
        
        setSessions((prev) =>
          prev.map((s) =>
             s.id === activeSessionId
               ? {
                   ...s,
                   chats: chats.some(c => c.isAdminReply)
                     ? chats
                     : [
                        ...chats,
                        ...adminReplyList.map(reply => ({
                          role: "admin",
                          text: reply.message,
                          time: new Date(reply.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
                          isAdminReply: true
                        }))
                      ]
                }
              : s
          )
        );
      }
    }
  }, [adminReplies, activeSessionId, escalatedChatIds, chats]);

  const isEmptyState = !activeSessionId || chats.length === 0;

  return (
    <div className="h-[100dvh] w-screen flex bg-gray-50 font-sans text-gray-900 overflow-hidden relative">
      
      {/* ===== OVERLAY GELAP UNTUK MOBILE SAAT SIDEBAR BUKA ===== */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* ===== SIDEBAR (RESPONSIVE DRAWER) ===== */}
      <aside className={`fixed md:relative z-50 h-full bg-white flex flex-col justify-between py-6 transition-transform duration-300 ease-in-out flex-shrink-0 border-r border-gray-100 ${
        isSidebarOpen 
          ? "translate-x-0 w-64 md:w-56 px-5 shadow-2xl md:shadow-none" 
          : "-translate-x-full md:translate-x-0 md:w-16 md:px-3 px-3"
      }`}>
        <div className="flex flex-col gap-6 overflow-hidden">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-2 ${!isSidebarOpen && 'md:hidden'}`}>
              <img src={logoSakti} alt="SAKTI" className="w-5 h-5 object-contain" />
              <span className="text-lg font-bold text-[#002b80] tracking-wide">SAKTI</span>
            </div>
            
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition flex-shrink-0 hidden md:block"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition flex-shrink-0 md:hidden"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <button
            onClick={startNewSession}
            className={`bg-[#004cdb] hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 transition-all active:scale-95 ${
              isSidebarOpen ? "w-full py-2.5 px-4 text-sm font-medium overflow-hidden" : "w-10 h-10 justify-center mx-auto hidden md:flex"
            }`}
          >
            {/* 👉 FIX: Tambah min-w-[16px] biar logo nggak gepeng */}
            <svg className="w-4 h-4 min-w-[16px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            {/* 👉 FIX: Tambah flex-1 min-w-0 biar teks ngalah dipotong */}
            {isSidebarOpen && <span className="truncate flex-1 min-w-0 text-left">Obrolan Baru</span>}
          </button>
          
          <div className="flex flex-col gap-1 overflow-y-auto">
            {isSidebarOpen && sessions.length > 0 && (
              <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest px-1 mb-1 flex-shrink-0">Riwayat</p>
            )}
            {sessions.length === 0 ? (
              <button className={`text-gray-400 rounded-xl flex items-center gap-2 flex-shrink-0 ${
                isSidebarOpen ? "w-full py-2.5 px-4 text-sm overflow-hidden" : "w-10 h-10 justify-center mx-auto hidden md:flex"
              }`}>
                <svg className="w-4 h-4 min-w-[16px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {isSidebarOpen && <span className="truncate flex-1 min-w-0 text-left text-xs">Belum ada riwayat</span>}
              </button>
            ) : (
              sessions.map((session) => (
                <button
                  key={session.id}
                  onClick={() => selectSession(session)}
                  className={`rounded-xl flex items-center gap-2 transition-all text-left flex-shrink-0 ${
                    isSidebarOpen ? "w-full py-2 px-3 text-sm overflow-hidden" : "w-10 h-10 justify-center mx-auto hidden md:flex"
                  } ${
                    activeSessionId === session.id
                      ? "bg-blue-50 text-[#004cdb] font-medium"
                      : "text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  {/* 👉 FIX: Tambah min-w-[16px] di sini juga */}
                  <svg className="w-4 h-4 min-w-[16px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {/* 👉 FIX: Tambah flex-1 min-w-0 di sini juga */}
                  {isSidebarOpen && (
                    <span className="truncate flex-1 min-w-0 text-xs">{session.title}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className={`text-red-500 hover:bg-red-50 rounded-xl flex items-center gap-2 transition-all flex-shrink-0 ${
            isSidebarOpen ? "w-full py-2.5 px-4 text-sm font-semibold overflow-hidden" : "w-10 h-10 justify-center mx-auto hidden md:flex"
          }`}
        >
          <svg className="w-4 h-4 min-w-[16px] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {isSidebarOpen && <span className="truncate flex-1 min-w-0 text-left">Logout</span>}
        </button>
      </aside>

      {/* ===== MAIN AREA ===== */}
      <main className="flex-1 h-full flex flex-col relative bg-white overflow-hidden w-full">
        
        {/* 👉 MOBILE HEADER: HAMBURGER MENU SEKARANG DI KIRI! 👈 */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-white z-30 shadow-sm">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none p-1.5 bg-gray-50 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <img src={logoSakti} alt="SAKTI" className="w-6 h-6 object-contain" />
            <span className="text-lg font-bold text-[#002b80] tracking-wide">SAKTI</span>
          </div>
        </div>

        {isEmptyState && (
          <div className="flex-1 flex flex-col items-center justify-center px-4 md:px-6">
            <div className="flex flex-col items-center text-center mb-6 md:mb-8 mt-10 md:mt-0">
              <h1 className="text-xl md:text-2xl font-medium text-gray-800 mb-1">
                Halo {user?.name?.split(" ")[0] || "User"}!
              </h1>
              <p className="text-xl md:text-2xl font-medium text-gray-800">
                Ada yang bisa <span className="text-[#004cdb] font-semibold">SAKTI</span> bantu?
              </p>
            </div>
            <div className="w-full max-w-xl relative">
              <div
                className="absolute pointer-events-none rounded-full hidden md:block"
                style={{
                  inset: "-20px",
                  background: "radial-gradient(ellipse at center, rgba(0,76,219,0.15) 0%, transparent 70%)",
                  filter: "blur(16px)",
                }}
              />
              <form
                onSubmit={handleSendMessage}
                className="relative bg-white border border-gray-200 rounded-3xl md:rounded-full px-4 md:px-5 py-2 md:py-3 flex items-center gap-3 shadow-sm md:shadow-[0_4px_30px_rgba(0,76,219,0.15)]"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ketik Pesan..."
                  className="flex-1 bg-transparent text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none py-1"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  className="w-9 h-9 bg-[#004cdb] hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 flex-shrink-0"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </button>
              </form>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-2 max-w-lg">
              {["Cara buat KTP baru?", "Syarat akta kelahiran", "Pindah domisili", "Lokasi kantor"].map((q) => (
                <button
                  key={q}
                  onClick={() => setInputMessage(q)}
                  className="text-xs text-gray-500 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:text-[#004cdb] px-4 py-2 rounded-full transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {!isEmptyState && (
          <>
            <div
              ref={chatBodyRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6"
            >
              {chats.map((chat, i) => (
                // 👉 FIX: Tambahkan items-end biar avatar nempel sejajar sama ekor gelembung bawahnya 👈
                <div key={i} className={`flex w-full items-end ${chat.role === "system" ? "justify-center" : chat.role === "user" ? "justify-end" : "justify-start"}`}>
                  {(chat.role === "bot" || chat.role === "admin") && (
                    // 👉 FIX: margin top (mt) dihapus, cukup margin right aja
                    <div className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center mr-2 md:mr-3 flex-shrink-0 ${
                      chat.role === "admin" ? "bg-emerald-100" : "bg-blue-100"
                    }`}>
                      {chat.role === "admin" ? (
                        <span className="text-xs font-bold text-emerald-600">A</span>
                      ) : (
                        <img src={logoSakti} alt="bot" className="w-4 h-4 md:w-4 md:h-4 object-contain" />
                      )}
                    </div>
                  )}
                  <div className={chat.role === "system" ? "max-w-[95%] md:max-w-md text-center" : "max-w-[85%] md:max-w-[70%]"}>
                    <div className={`px-4 py-3 md:py-3.5 rounded-2xl text-[13px] md:text-sm leading-relaxed md:leading-relaxed break-words ${
                      chat.role === "user"
                        ? "bg-[#004cdb] text-white rounded-br-sm shadow-sm"
                        : chat.role === "admin"
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-100 rounded-bl-sm"
                          : chat.role === "system"
                            ? chat.isInfo
                              ? "bg-green-50 text-green-800 border border-green-100 rounded-lg px-3 py-2 max-w-full"
                              : "bg-amber-50 text-amber-800 border border-amber-100 rounded-lg px-3 py-2 max-w-full"
                            : chat.isError
                              ? "bg-red-50 border border-red-100 text-red-600 rounded-bl-sm"
                              : "bg-gray-100 text-gray-800 rounded-bl-sm"
                    }`}>
                      <p className="whitespace-pre-line">{chat.text}</p>
                    </div>
                    
                    <p className={`text-[10px] md:text-[11px] text-gray-400 mt-1 md:mt-1.5 flex items-center gap-1 ${chat.role === "user" ? "justify-end" : "justify-start"}`}>
                      <span>{chat.time}</span>
                      
                      {chat.role === "user" && (
                        <span className="flex items-center">
                          {chat.status === "sending" && (
                            <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          
                          {chat.status === "failed" && (
                            <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}

                          {(!chat.status || chat.status === "sent") && (
                            <>
                              {isCurrentChatEscalated ? (
                                <svg 
                                  className={`w-3.5 h-3.5 md:w-4 md:h-4 ${chats.slice(i + 1).some(c => c.role === "admin") ? "text-blue-500" : "text-gray-400"}`} 
                                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5l4 4 8-8m-4 8l4 4 8-8" />
                                </svg>
                              ) : (
                                <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </>
                          )}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              ))}

              <div ref={messagesEndRef} />

              {/* 👉 FIX: Tambahkan items-end juga untuk bagian "Mengetik..." biar konsisten */}
              {loading && (
                <div className="flex justify-start items-end">
                  <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 md:mr-3 flex-shrink-0">
                    <img src={logoSakti} alt="bot" className="w-4 h-4 md:w-4 md:h-4 object-contain" />
                  </div>
                  <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1 items-center h-3 md:h-4">
                      {[0, 0.2, 0.4].map((delay, j) => (
                        <span key={j} className="w-1.5 h-1.5 md:w-2 md:h-2 bg-[#004cdb] rounded-full animate-bounce opacity-60" style={{ animationDelay: `${delay}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 md:px-6 py-3 md:py-4 border-t border-gray-100 bg-white">
              {isCurrentChatResolved ? (
                <div className="p-3 md:p-4 bg-green-50 border border-green-100 rounded-2xl text-center text-xs md:text-sm text-green-800 shadow-sm">
                  <p className="font-bold text-sm md:text-base mb-1">Obrolan telah selesai</p>
                  <p className="text-green-700">Admin telah menutup sesi ini. Jika ada pertanyaan lain, silahkan <button onClick={startNewSession} className="text-[#004cdb] font-bold hover:underline">buat obrolan baru</button>.</p>
                </div>
              ) : (
                <>
                  {isCurrentChatEscalated && (
                    <div className="mb-2 md:mb-3 p-2.5 md:p-3 bg-blue-50 border border-blue-100 rounded-lg text-[11px] md:text-xs text-blue-800">
                      <p className="font-medium">Chat Anda sedang ditangani Admin</p>
                      <p className="text-blue-700 mt-0.5 md:mt-1">Anda masih bisa menambah informasi atau klarifikasi untuk membantu Admin memahami pertanyaan Anda lebih baik.</p>
                    </div>
                  )}
                  <div className="w-full max-w-3xl mx-auto relative">
                    <form
                      onSubmit={handleSendMessage}
                      className="relative bg-white border border-gray-200 rounded-3xl md:rounded-full px-3 md:px-5 py-2 md:py-3 flex items-center gap-2 md:gap-3 shadow-sm md:shadow-[0_4px_30px_rgba(0,76,219,0.12)]"
                    >
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder={isCurrentChatEscalated ? "Tambah info ke Admin..." : "Ketik Pesan..."}
                        className="flex-1 bg-transparent text-[13px] md:text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none py-1"
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      />
                      <button
                        type="submit"
                        disabled={!inputMessage.trim() || loading}
                        className="w-8 h-8 md:w-9 md:h-9 bg-[#004cdb] hover:bg-blue-700 disabled:bg-gray-200 text-white rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 flex-shrink-0"
                      >
                        <svg className="w-4 h-4 md:w-4 md:h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default ChatUser;