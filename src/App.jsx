import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { auth, db } from './firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, arrayUnion, serverTimestamp, getDoc } from "firebase/firestore";
import Login from './Login';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { text: "Marhaba! 🌅 I'm your Doha Explorer. How can I assist you today?", sender: 'bot' }
  ]);
  const chatEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadChatHistory = async () => {
      if (user) {
        const chatRef = doc(db, "users", user.uid, "history", "active_chat");
        try {
          const docSnap = await getDoc(chatRef);
          if (docSnap.exists()) {
            setMessages(docSnap.data().messages);
          }
        } catch (err) {
          console.error("Firestore Error:", err);
        }
      }
    };
    loadChatHistory();
  }, [user]);

  const handleSend = async () => {
    if (!input.trim() || !user) return;

    // Use 'user' instead of 'users' to match your UI logic
    const userMsg = { text: input, sender: 'user', time: new Date() };
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsLoading(true);

    const chatRef = doc(db, "users", user.uid, "history", "active_chat");

    try {
      await setDoc(chatRef, {
        messages: arrayUnion(userMsg),
        lastUpdated: serverTimestamp()
      }, { merge: true });

      const res = await axios.post('https://backend-chatbot-rlik.onrender.com/api/chat', 
        { message: currentInput },
        { signal: controller.signal }
      );

      const botReply = { text: res.data.reply, sender: 'bot', time: new Date() };
      setMessages(prev => [...prev, botReply]);

      await setDoc(chatRef, {
        messages: arrayUnion(botReply),
        lastUpdated: serverTimestamp()
      }, { merge: true });

    } catch (err) {
      if (!axios.isCancel(err)) {
        console.error("Error:", err);
        setMessages(prev => [...prev, { text: "Connection lost. Please check your internet or wait for the server to wake up.", sender: 'bot' }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  if (loading) return <div className="h-screen bg-[#0E0E10] flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="App">
      {!user ? (
        <Login onLogin={setUser} />
      ) : (
        <div className="flex h-screen w-full bg-[#0E0E10] text-white font-sans overflow-hidden">
          
          {/* --- SIDEBAR (Hidden on small mobile screens) --- */}
         {/* Logic: Hidden on mobile unless isSidebarOpen is true. Always shown on Desktop (md:flex) */}
  <aside className={`
    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
    md:translate-x-0 md:static fixed inset-y-0 left-0 z-50
    w-64 bg-[#1C1C1F] flex flex-col border-r border-white/5 h-full shrink-0 transition-transform duration-300 ease-in-out
  `}>
    <div className="p-6 shrink-0 flex justify-between items-center"> 
      <button 
        onClick={() => {
          setMessages([{ text: "Hello! How can I help you explore Doha? 🇶🇦", sender: 'bot' }]);
          setIsSidebarOpen(false); // Close sidebar on mobile after clicking
        }}
        className="w-full py-3 px-4 bg-gradient-to-r from-[#8A1538] to-red-900 rounded-xl font-bold text-sm text-white shadow-lg hover:opacity-90 transition-all"
      >
        + New Chat
      </button>
      {/* Close button for mobile only */}
      <button onClick={() => setIsSidebarOpen(false)} className="md:hidden ml-2 text-white/50">✕</button>
    </div>

    <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide">
      <p className="text-[10px] uppercase tracking-widest text-white/30 px-2 mb-4">Recent Explorations</p>
      {messages.length > 1 && (
        <div className="p-3 bg-white/5 rounded-lg text-xs text-white/70 border border-white/5 truncate">
          📍 {messages.find(m => m.sender === 'user')?.text || "New Exploration"}
        </div>
      )}
    </nav>

           <div className="p-4 bg-[#1C1C1F] border-t border-white/5 shrink-0">
      <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors">
        <img src={user?.photoURL || "https://via.placeholder.com/32"} alt="profile" className="w-8 h-8 rounded-full border border-[#8A1538]/50" />
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-medium text-white truncate w-32">{user?.displayName}</span>
          <button onClick={() => auth.signOut()} className="text-[10px] text-white/30 hover:text-[#8A1538] text-left">Sign Out</button>
        </div>
      </div>
    </div>
  </aside>

          {/* --- MAIN CHAT AREA --- */}
         <main className="flex-1 flex flex-col bg-[#0E0E10] overflow-hidden relative">
            
            {/* Header */}
    <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-8 border-b border-white/5 bg-[#0E0E10]/80 backdrop-blur-md z-20">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Toggle Button (Hamburger) */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden p-2 hover:bg-white/5 rounded-lg"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="flex items-center gap-2">
          <span className="text-[#8A1538] font-black text-lg md:text-xl italic tracking-tighter">DOHA</span>
          <span className="text-white/40 text-[10px] md:text-sm tracking-widest uppercase">Explorer</span>
        </div>
      </div>
    </header>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto scroll-smooth">
              {messages.length <= 1 ? (
                /* SUGGESTIONS */
                <div className="min-h-full flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 bg-[#8A1538]/20 rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-3xl">🇶🇦</span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-black mb-2">Ask me anything.</h2>
                  <p className="text-white/40 text-sm md:text-lg mb-8">Your guide to Qatar.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
                    {["Plan a Day Trip", "Local Cuisine", "Transit Guide","Explore Qatar"].map((item, idx) => (
                      <button key={idx} onClick={() => setInput(item)} className="p-4 bg-[#1C1C1F] border border-white/5 rounded-xl text-left hover:bg-white/5 text-sm">
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* MESSAGES */
                <div className="p-4 md:p-8 space-y-6 max-w-4xl mx-auto w-full">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-3 md:gap-6 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg shrink-0 flex items-center justify-center text-[10px] font-bold shadow-lg ${m.sender === 'user' ? 'bg-white/10' : 'bg-[#8A1538]'}`}>
                        {m.sender === 'user' ? 'ME' : 'DE'}
                      </div>
                      <div className={`flex flex-col space-y-1 ${m.sender === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                        <div className={`p-3 md:p-4 rounded-2xl text-sm md:text-base leading-relaxed ${m.sender === 'user' ? 'bg-[#8A1538]/20 border border-[#8A1538]/30' : 'bg-[#1C1C1F] border border-white/5'}`}>
                          {m.sender === 'bot' ? (
                            <div className="prose prose-invert prose-sm max-w-none">
                              <ReactMarkdown>{m.text}</ReactMarkdown>
                            </div>
                          ) : m.text}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isLoading && <div className="text-xs text-[#8A1538] animate-pulse">Explorer is thinking...</div>}
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* --- INPUT BOX --- */}
            <div className="p-4 md:p-8 bg-gradient-to-t from-[#0E0E10] to-transparent">
              <div className="max-w-3xl mx-auto relative flex items-center gap-2">
                <input 
                  className="flex-1 bg-[#1C1C1F] border border-white/10 rounded-xl px-4 py-3 md:py-5 outline-none focus:border-[#8A1538]/50 text-sm md:text-base shadow-2xl"
                  value={input} 
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about Doha..."
                />
                <button 
                  onClick={handleSend}
                  className="bg-[#8A1538] p-3 md:p-4 rounded-xl hover:opacity-90 transition-all shadow-lg"
                >
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
              </div>
              <p className="hidden md:block text-center text-[10px] text-white/20 mt-4 px-4">
                Doha Explorer AI can make mistakes. Verify important info.
              </p>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

export default App;