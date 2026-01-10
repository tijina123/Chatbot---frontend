import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import { auth } from './firebase'; // Import auth from your config
import { onAuthStateChanged } from 'firebase/auth';
import Login from './Login'; // Import the Login component we planned
import { db } from './firebase';
import { doc, setDoc, arrayUnion, serverTimestamp } from "firebase/firestore";
import { getDoc } from "firebase/firestore";


function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { text: "Marhaba! 🌅 I'm your Doha Explorer. How can I assist you today?", sender: 'bot' }
  ]);
  const chatEndRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef(null); // To store the current request's controller

  const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(scrollToBottom, [messages]);


  

// 1. Keep your Auth useEffect
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setLoading(false);
  });
  return () => unsubscribe();
}, []);

// 2. Add this NEW useEffect to load history when the user changes
useEffect(() => {
  const loadChatHistory = async () => {
    if (user) {
      console.log("Fetching history for UID:", user.uid); // Debug log 1
      const chatRef = doc(db, "users", user.uid, "history", "active_chat");
      
      try {
        const docSnap = await getDoc(chatRef);
        if (docSnap.exists()) {
          console.log("Data found:", docSnap.data()); // Debug log 2
          setMessages(docSnap.data().messages);
        } else {
          console.log("No document found in Firestore at this path."); // Debug log 3
        }
      } catch (err) {
        console.error("Firestore Error:", err);
      }
    }
  };
  loadChatHistory();
}, [user]);

// Auto-scroll to the latest message
useEffect(() => {
  chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]);
  
 const handleSend = async () => {
  if (!input.trim() || !user) return; // Ensure user exists before saving

  // 1. Prepare the message
  const userMsg = { text: input, sender: 'users', time: new Date() };
  
  // 2. Setup AbortController
  const controller = new AbortController();
  abortControllerRef.current = controller;

  // 3. Update UI immediately
  setMessages(prev => [...prev, userMsg]);
  const currentInput = input; // Store input before clearing
  setInput('');
  setIsLoading(true);

  // Define chatRef here so it's accessible everywhere in the function
  const chatRef = doc(db, "users", user.uid, "history", "active_chat");

  try {
    // 4. Save User Message to Firestore
    await setDoc(chatRef, {
      messages: arrayUnion(userMsg),
      lastUpdated: serverTimestamp()
    }, { merge: true });

    // 5. Call API
    const res = await axios.post('http://localhost:5000/api/chat', 
      { message: currentInput },
      { signal: controller.signal }
    );

    const botReply = { text: res.data.reply, sender: 'bot', time: new Date() };

    // 6. Update UI with Bot Reply
    setMessages(prev => [...prev, botReply]);

    // 7. Save Bot Reply to Firestore
    await setDoc(chatRef, {
      messages: arrayUnion(botReply),
      lastUpdated: serverTimestamp()
    }, { merge: true });

  } catch (err) {
    if (axios.isCancel(err)) {
      console.log('Request canceled by user');
    } else {
      console.error("Error:", err);
      setMessages(prev => [...prev, { text: "Connection lost...", sender: 'bot' }]);
    }
  } finally {
    setIsLoading(false);
    abortControllerRef.current = null;
  }
};



 return (
  <div className="App">
    {!user ? (
      /* --- 1. LOGIN SCREEN --- */
      <Login onLogin={setUser} />
    ) : (
      /* --- 2. FULL DASHBOARD (Only shows when user is logged in) --- */
      <div className="flex h-screen w-full bg-[#0E0E10] text-white font-sans overflow-hidden selection:bg-qatar/30">
        
        {/* --- SIDEBAR --- */}
        <aside className="w-64 bg-[#1C1C1F] flex flex-col border-r border-white/5 h-full overflow-hidden shrink-0">
          
          {/* New Chat Button */}
          <div className="p-6 shrink-0"> 
            <button 
  onClick={() => {
    setMessages([{ text: "Hello! How can I help you explore Doha today? 🇶🇦", sender: 'bot' }]);
    setInput('');
  }}
  className="w-full py-3 px-4 bg-gradient-to-r from-qatar to-red-900 rounded-xl font-bold text-sm text-white shadow-lg hover:opacity-90 transition-all"
>
  + New Chat
</button>
          </div>

          {/* Scrollable History List */}
         <nav className="flex-1 px-4 space-y-2 overflow-y-auto scrollbar-hide bg-[#1C1C1F]">
  <p className="text-[10px] uppercase tracking-widest text-white/30 px-2 mb-4">
    Recent Explorations
  </p>
  
  {/* If there are messages, show the first user message as the title */}
  {messages.length > 1 ? (
    <div className="p-3 bg-white/5 rounded-lg text-xs text-white/70 border border-white/5 cursor-pointer hover:bg-white/10 transition-all flex items-center gap-2">
      <span className="text-qatar">📍</span>
      <span className="truncate">
        {/* Find the first message from the user to use as the title */}
        {messages.find(m => m.sender === 'users')?.text || "New Exploration"}
      </span>
    </div>
  ) : (
    <p className="text-[10px] text-white/10 px-2 italic">No recent history</p>
  )}
</nav>

          {/* User Profile Section (Pinned to Bottom) */}
          <div className="p-4 bg-[#1C1C1F] border-t border-white/5 shrink-0">
            <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors">
              <img 
                src={user?.photoURL || "https://via.placeholder.com/32"} 
                alt="profile" 
                className="w-8 h-8 rounded-full border border-qatar/50 shadow-lg"
              />
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-white truncate w-32">{user?.displayName}</span>
               <button 
  onClick={async () => {
    try {
      await auth.signOut();
      // The useEffect in App.jsx will automatically see this 
      // and redirect the user back to the Login screen.
    } catch (err) {
      console.error("Logout Error:", err);
    }
  }} 
  className="text-[10px] text-white/30 hover:text-qatar text-left transition-colors"
>
  Sign Out
</button>
              </div>
            </div>
          </div>
        </aside>

        {/* --- MAIN CHAT AREA --- */}
        <main className="flex-1 flex flex-col bg-[#0E0E10] overflow-hidden">
          
          {/* Header */}
          <header className="h-16 flex items-center justify-between px-8 border-b border-white/5 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <span className="text-qatar font-black text-xl italic tracking-tighter">DOHA</span>
              <span className="text-white/40 text-sm tracking-widest uppercase">Explorer</span>
            </div>
          </header>

          {/* Content Area (Messages or Suggestions) */}
          <div className="flex-1 overflow-y-auto">
            {messages.length <= 1 ? (
              /* --- SUGGESTION GRID (Shows on New Chat) --- */
              <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="text-center mb-12">
                  <div className="w-20 h-20 bg-qatar/20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <span className="text-4xl">🇶🇦</span>
                  </div>
                  <h2 className="text-4xl font-black mb-2 tracking-tight">Ask me anything.</h2>
                  <p className="text-white/40 font-medium text-lg">Your intelligent guide to the heart of Qatar.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full">
                  {[
                    { title: "Plan a Day Trip", desc: "Best spots in Msheireb Downtown", icon: "🏙️" },
                    { title: "Local Cuisine", desc: "Where to find the best Machboos", icon: "🥘" },
                    { title: "Transit Guide", desc: "How to navigate the Doha Metro", icon: "🚇" },
                    { title: "Hidden Gems", desc: "Explore the Singing Sand Dunes", icon: "🏜️" }
                  ].map((item, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setInput(item.desc)}
                      className="p-5 bg-[#1C1C1F] border border-white/5 rounded-2xl text-left hover:border-qatar/50 hover:bg-white/5 transition-all group"
                    >
                      <span className="text-2xl mb-3 block">{item.icon}</span>
                      <h3 className="font-bold text-sm text-white group-hover:text-qatar transition-colors">{item.title}</h3>
                      <p className="text-xs text-white/30 mt-1">{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* --- CHAT MESSAGES --- */
              <div className="p-4 md:p-12 space-y-8 max-w-4xl mx-auto w-full">
                {messages.map((m, i) => (
                  <div key={i} className={`flex gap-6 ${m.sender === 'user' ? 'flex-row-reverse text-right' : ''}`}>
                    <div className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-lg
                      ${m.sender === 'user' ? 'bg-white/10 text-white' : 'bg-qatar text-white'}`}>
                      {m.sender === 'user' ? 'U' : 'DE'}
                    </div>
                    <div className="flex-1 space-y-2 max-w-[85%]">
                      <p className="text-[10px] text-white/30 uppercase tracking-widest">
                        {m.sender === 'user' ? 'You' : 'Doha Explorer AI'}
                      </p>
                      <div className="text-white/90 leading-relaxed text-base bg-white/5 p-4 rounded-2xl border border-white/5">
                        {m.sender === 'bot' ? (
                          <div className="prose prose-invert max-w-none">
                            <ReactMarkdown>{m.text}</ReactMarkdown>
                          </div>
                        ) : m.text}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Loading State */}
                {isLoading && (
                  <div className="flex gap-6 animate-pulse">
                    <div className="w-9 h-9 rounded-xl bg-qatar/50 shrink-0" />
                    <div className="space-y-3">
                      <div className="h-2 w-20 bg-white/10 rounded" />
                      <div className="h-4 w-64 bg-white/5 rounded" />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}
          </div>

          {/* --- INPUT BOX --- */}
          <div className="p-8 bg-gradient-to-t from-[#0E0E10] via-[#0E0E10] to-transparent">
            <div className="max-w-3xl mx-auto relative group">
              <input 
                className="w-full bg-[#1C1C1F] border border-white/10 rounded-2xl px-6 py-5 pr-16 outline-none focus:border-qatar/50 transition-all text-white shadow-2xl"
                value={input} 
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask about Doha..."
              />
              <button 
                onClick={handleSend}
                className="absolute right-3 top-1/2 -translate-y-1/2 bg-qatar p-3 rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
             
            </div>
            {/* Professional Disclaimer */}
            <p className="text-center text-[10px] text-white/20 mt-4 px-4 leading-relaxed">
              Doha Explorer is an AI-powered student project built for learning purposes. 
              AI responses are generated by Google Gemini and should be verified via official sources. Not an official guide.
            </p>
          </div>

        </main>
      </div>
    )}
  </div>
);
}

export default App;