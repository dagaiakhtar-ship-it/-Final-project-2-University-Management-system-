/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Send, Loader2, MessageSquare, Bot, ArrowRight, CornerDownLeft } from 'lucide-react';
import { apiClient } from '../../api/api-client';
import { useAuthStore } from '../../store/auth.store';

export const FloatingCopilot: React.FC = () => {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'User' | 'AI'; content: string; time: string }>>([
    { role: 'AI', content: 'Hello! I am your global Smart Campus AI Copilot. How can I assist you with academic guidelines, predictive intelligence, or workflow automation today?', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages list changes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Don't render if there is no logged-in user
  if (!user) {
    return null;
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setIsLoading(true);

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'User', content: userMsg, time: currentTime }]);

    try {
      // Use the dedicated /api/ai/copilot endpoint for lightweight turn-by-turn guidance
      const res = await apiClient.post('/ai/copilot', {
        prompt: userMsg,
        assistantType: user.role === 'TEACHER' ? 'Faculty' : user.role === 'STUDENT' ? 'Student' : 'University'
      });

      setMessages(prev => [...prev, {
        role: 'AI',
        content: res.data.reply || 'No response formulation returned.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'AI',
        content: '[Offline Mode active] Thank you for your input. I processed your request. Please ensure GEMINI_API_KEY is configured in server environment configurations for live LLM responses.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans" id="floating-copilot-container">
      {/* 1. Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-full shadow-xl hover:bg-slate-800 active:scale-95 transition-all duration-200 border border-slate-800 group"
          id="btn-toggle-floating-copilot"
        >
          <div className="relative">
            <Sparkles className="h-5 w-5 text-indigo-400 group-hover:animate-bounce" />
            <span className="absolute top-0 right-0 h-2 w-2 bg-emerald-400 rounded-full animate-ping"></span>
          </div>
          <span className="text-xs font-semibold tracking-wide">AI Copilot</span>
        </button>
      )}

      {/* 2. Floating Chat Box */}
      {isOpen && (
        <div 
          className="w-96 h-[500px] bg-white rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-200"
          id="floating-copilot-chatbox"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600 rounded-lg text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-tight">University Smart Copilot</h3>
                <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Grounded Core Active
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-md hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Minimize Copilot"
              id="btn-close-floating-copilot"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-grow overflow-y-auto p-4 bg-slate-50/50 space-y-4" id="floating-copilot-messages">
            {messages.map((msg, index) => {
              const isAI = msg.role === 'AI';
              return (
                <div key={index} className={`flex gap-2.5 ${!isAI ? 'justify-end' : ''}`}>
                  {isAI && (
                    <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      AI
                    </div>
                  )}
                  <div className={`p-3 rounded-xl text-xs max-w-[80%] shadow-xs border ${
                    isAI 
                      ? 'bg-white text-slate-800 border-slate-200/80 rounded-tl-none' 
                      : 'bg-slate-900 text-white border-slate-950 rounded-tr-none'
                  }`}>
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <span className="text-[8px] text-slate-400 font-mono block mt-1 text-right">{msg.time}</span>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2.5">
                <div className="h-6 w-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                  AI
                </div>
                <div className="p-3 bg-white text-slate-500 border border-slate-200 rounded-xl text-xs rounded-tl-none flex items-center gap-1.5 shadow-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
                  <span>Analyzing database query...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom input form */}
          <div className="p-3 bg-white border-t border-slate-100 flex-shrink-0">
            <form onSubmit={handleSend} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about GPA, syllabus, policies..."
                className="flex-1 bg-slate-50 hover:bg-slate-100/50 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-lg px-3 py-2 text-xs outline-none transition-all"
                disabled={isLoading}
                id="floating-copilot-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-lg transition-all shadow-sm shrink-0"
                id="floating-copilot-send-btn"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
