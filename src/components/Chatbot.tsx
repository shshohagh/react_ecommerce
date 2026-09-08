import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, X, Sparkles, Trash2, ArrowUpRight, MessageSquare, RefreshCw, HelpCircle, ChevronDown, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
}

const QUICK_SUGGESTIONS = [
  'What is your return policy?',
  'How fast is shipping & delivery?',
  'Recommend the best wireless headphones',
  'Do you have any discount promo codes?',
  'How can I track my order?',
];

const INITIAL_MESSAGE: ChatMessage = {
  id: 'welcome-1',
  role: 'model',
  content: "👋 Hello! I'm **SwiftBot**, your AI shopping assistant. Ask me anything about our products, specifications, shipping times, return policies, or current discounts!",
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
};

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem('swiftbot_chat_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return [INITIAL_MESSAGE];
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Save conversation in session storage
  useEffect(() => {
    try {
      sessionStorage.setItem('swiftbot_chat_history', JSON.stringify(messages));
    } catch (e) {
      // ignore
    }
  }, [messages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isTyping) return;

    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationHistory: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      const data = await response.json();
      const botReply = data.reply || "I'm here to help with your orders and products! Could you please clarify your question?";

      const botMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'model',
        content: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages(prev => [...prev, botMsg]);
      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: 'msg-' + (Date.now() + 1),
        role: 'model',
        content: "I'm having a little trouble connecting right now. You can check our [Track Order](/track-order) page or email us at **support@swiftcart.com** for immediate help!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
    sessionStorage.removeItem('swiftbot_chat_history');
  };

  // Helper to format bot markdown text cleanly
  const renderFormattedContent = (content: string) => {
    // Split by newlines
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Bold rendering
      let processedLine: React.ReactNode = line;

      // Handle simple markdown bold **text**
      if (line.includes('**')) {
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        processedLine = parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pIdx} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
          }
          return part;
        });
      }

      // Handle bullet points
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        return (
          <div key={idx} className="flex items-start gap-2 my-1 pl-2">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
            <span className="flex-grow">{typeof processedLine === 'string' ? processedLine.replace(/^[-*]\s*/, '') : processedLine}</span>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-2" />;
      }

      return <p key={idx} className="my-1 leading-relaxed">{processedLine}</p>;
    });
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 print:hidden">
        <motion.button
          onClick={() => setIsOpen(prev => !prev)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative flex items-center gap-2.5 px-4 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
          aria-label="Open AI Shopping Assistant"
        >
          <div className="relative">
            <Bot className="h-6 w-6 transition-transform group-hover:rotate-6" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 ring-2 ring-indigo-600"></span>
            </span>
          </div>
          <span className="font-bold text-sm hidden sm:inline-block">Ask AI Assistant</span>
          
          {hasUnread && (
            <span className="px-1.5 py-0.5 bg-amber-400 text-gray-900 text-[10px] font-black rounded-full uppercase">
              1
            </span>
          )}
        </motion.button>
      </div>

      {/* Expandable Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[600px] h-[80vh] bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col overflow-hidden transition-colors"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 p-4 text-white flex items-center justify-between flex-shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white ring-1 ring-white/20">
                  <Bot className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base tracking-tight leading-none">SwiftBot</h3>
                    <span className="px-2 py-0.5 bg-white/20 text-[10px] font-extrabold rounded-full backdrop-blur-sm">
                      AI Powered
                    </span>
                  </div>
                  <p className="text-xs text-indigo-100 mt-1 flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                    Online • Product & Policy Expert
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  className="p-2 text-indigo-100 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Minimize chat"
                  className="p-2 text-indigo-100 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Quick Suggestions (if conversation is short) */}
            {messages.length <= 2 && (
              <div className="p-3 bg-indigo-50/60 dark:bg-indigo-950/40 border-b border-indigo-100/50 dark:border-indigo-900/30 flex-shrink-0">
                <p className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Suggested Questions:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {QUICK_SUGGESTIONS.map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(suggestion)}
                      disabled={isTyping}
                      className="text-left text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-gray-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer shadow-2xs"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat Messages List */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 text-sm custom-scrollbar">
              {messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className="h-7 w-7 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[82%] rounded-2xl px-4 py-3 shadow-xs ${
                        isUser
                          ? 'bg-indigo-600 text-white rounded-tr-xs'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-xs border border-gray-200/50 dark:border-gray-700/50'
                      }`}
                    >
                      <div className="text-sm">
                        {isUser ? <p className="leading-relaxed">{msg.content}</p> : renderFormattedContent(msg.content)}
                      </div>
                      <div className={`text-[10px] mt-1 text-right ${isUser ? 'text-indigo-200' : 'text-gray-400 dark:text-gray-500'}`}>
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-start gap-2.5 justify-start">
                  <div className="h-7 w-7 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-2xl rounded-tl-xs px-4 py-3 border border-gray-200/50 dark:border-gray-700/50 flex items-center gap-1.5">
                    <span className="text-xs font-medium mr-1 text-gray-600 dark:text-gray-300">SwiftBot is thinking</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Footer Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 flex-shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Ask about specs, shipping, returns..."
                disabled={isTyping}
                className="flex-grow px-4 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isTyping}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white rounded-xl shadow-md transition-all active:scale-95 cursor-pointer flex-shrink-0"
                title="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
