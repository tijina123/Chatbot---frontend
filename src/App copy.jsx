import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { text: "Marhaba! 🌅 I'm your Doha Explorer. Shall we visit Souq Waqif or Lusail today?", sender: 'bot' }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const QUICK_ACTIONS = [
  { label: "🏛️ Museums", query: "What are the best museums to visit in Doha?" },
  { label: "🥘 Best Food", query: "Where can I find the best traditional Qatari food?" },
  { label: "🚇 Metro Guide", query: "How do I use the Doha Metro to get to Lusail?" },
  { label: "🛍️ Shopping", query: "Which mall is better: Villaggio or Place Vendôme?" },
];

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/chat', { message: input });
      setMessages(prev => [...prev, { text: res.data.reply, sender: 'bot' }]);
    } catch (err) {
      setMessages(prev => [...prev, { text: "The desert winds are strong! Please try again. 🏜️", sender: 'bot' }]);
    } finally {
      setLoading(false);
    }
  };
  const clearChat = () => {
  setMessages([{ text: "Marhaba! 🌅 Chat cleared. Where should we explore next?", sender: 'bot' }]);
};

return (
 

    <div className="min-h-screen bg-sand flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        

        <div className="bg-qatar p-6 text-center shadow-lg relative">
  <h1 className="text-2xl font-bold text-white tracking-wide">Doha Explorer 🇶🇦</h1>
  <p className="text-white/80 text-sm italic">Discover the hidden gems of Qatar</p>
  
 
</div>

        {/* Chat Window */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
  {messages.map((m, i) => (
    /* 1. Added unique key and flex alignment */
    <div key={`${m.sender}-${i}`} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
      
      {/* 2. Chat bubble styling with Qatar colors */}
      <div className={`max-w-[85%] px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-sm
        ${m.sender === 'user' 
          ? 'bg-qatar text-white rounded-br-none' 
          : 'bg-white text-slate-800 border border-slate-100 rounded-bl-none'}`}>
        
        {/* 3. Render Markdown for the bot, plain text for the user */}
        {m.sender === 'bot' ? (
          <div className="prose prose-sm max-w-none prose-slate">
            <ReactMarkdown>{m.text}</ReactMarkdown>
          </div>
        ) : (
          m.text
        )}
      </div>
    </div>
  ))}
  {/* Auto-scroll target */}
  <div ref={chatEndRef} />

         
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white px-4 py-2 rounded-2xl text-xs text-slate-400 animate-pulse">
                Doha Explorer is thinking...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Actions Area */}
      <div className="px-4 py-2 flex flex-wrap gap-2 bg-slate-50">
        {QUICK_ACTIONS.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              setInput(action.query); // Fills the input
              // Optional: Directly trigger handleSend() here if you want it to be instant
            }}
            className="text-xs bg-white border border-slate-200 hover:border-qatar hover:text-qatar px-3 py-1.5 rounded-full transition-all shadow-sm"
          >
            {action.label}
          </button>
        ))}
      </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="flex gap-2 bg-slate-100 p-2 rounded-full">
            <input 
              className="flex-1 bg-transparent px-4 py-2 outline-none text-sm"
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about Msheireb, Katara, or MIA..."
            />
            <button 
              onClick={handleSend}
              className="bg-qatar text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-red-900 transition-colors shadow-md"
            >
              Explore
            </button>

            <button 
              onClick={clearChat}
              className="bg-qatar text-white px-6 py-2 rounded-full text-sm font-semibold hover:bg-red-900 transition-colors shadow-md"
            >
              Clear Chat
            </button>
          </div>
          <footer className="p-2 bg-slate-100 text-[10px] text-center text-slate-400">
  Powered by Gemini 3 Flash • Discover Doha 2026 🇶🇦
</footer>
        </div>
       
      </div>
    </div>
  );

  
}

export default App;



