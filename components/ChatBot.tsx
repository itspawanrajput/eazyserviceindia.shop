import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Bot, User, Sparkles } from 'lucide-react';
import { sendChatMessage, getChatConfig } from '../services/api';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('chatbot_session_id');
    if (stored) return stored;
    const id = 'chat_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem('chatbot_session_id', id);
    return id;
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getChatConfig().then(config => {
      setEnabled(config.enabled);
      setGreeting(config.greeting);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen && messages.length === 0 && greeting) {
      setMessages([{ role: 'assistant', content: greeting }]);
    }
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setIsTyping(true);

    try {
      const data = await sendChatMessage(text, sessionId);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble right now. Please call us at +91 9911481331 for immediate help." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const quickReplies = [
    'AC not cooling properly',
    'Book a service visit',
    'What are your prices?',
    'Service areas?',
  ];

  if (!enabled) return null;

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-[55] group"
        >
          <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-2xl shadow-blue-500/30 flex items-center justify-center hover:scale-110 transition-all duration-300 relative">
            <MessageCircle className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[11px] font-bold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
            Chat with AI ✨
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 rotate-45 -mt-1" />
          </div>
        </button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-6 left-6 z-[60] w-[370px] max-w-[calc(100vw-48px)] h-[520px] max-h-[calc(100vh-100px)] bg-white rounded-3xl shadow-2xl shadow-slate-900/20 border border-slate-200/80 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-white font-black text-[14px] leading-none">EazyService AI</h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-white/70 text-[10px] font-bold">Online • Usually replies instantly</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-md'
                    : 'bg-white text-slate-800 border border-slate-100 shadow-sm rounded-bl-md'
                }`}>
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 bg-slate-200 rounded-full flex items-center justify-center ml-2 mt-1 shrink-0">
                    <User className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center mr-2 mt-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <div className="bg-white border border-slate-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-md">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Replies (only when there's just the greeting) */}
            {messages.length <= 1 && !isTyping && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {quickReplies.map((qr) => (
                  <button
                    key={qr}
                    onClick={() => { setInput(qr); setTimeout(handleSend, 50); setInput(''); setMessages(prev => [...prev, { role: 'user', content: qr }]); setIsTyping(true); sendChatMessage(qr, sessionId).then(d => { setMessages(prev => [...prev, { role: 'assistant', content: d.reply }]); setIsTyping(false); }).catch(() => { setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, please try again.' }]); setIsTyping(false); }); }}
                    className="px-3 py-1.5 bg-white border border-blue-200 text-blue-600 rounded-full text-[11px] font-bold hover:bg-blue-50 transition-colors"
                  >
                    {qr}
                  </button>
                ))}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-slate-100 bg-white shrink-0">
            <form onSubmit={e => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[13px] focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={isTyping || !input.trim()}
                className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              >
                {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
            <p className="text-center text-[9px] text-slate-400 mt-2 font-medium">
              Powered by AI • Responses may not always be accurate
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
