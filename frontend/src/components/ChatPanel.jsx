import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import client from '../api/client';
import SkyBackground, { skyTheme } from './SkyBackground';
import useTimeOfDay from '../hooks/useTimeOfDay';

const WELCOME_TEXT = "Hi! I'm the TrainMitra assistant. Ask me about a train's schedule, Tatkal timings, delay reports, live status, or really anything else.";

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </svg>
  );
}

const STATUS_STEPS = ['Thinking...', 'Looking that up...', 'Almost there...'];

function TypingDots({ isDark }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    setStep(0);
    const t1 = setTimeout(() => setStep(1), 1800);
    const t2 = setTimeout(() => setStep(2), 5000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 px-3.5 py-2.5">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-slate-300' : 'bg-slate-400'}`}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-400'}`}>{STATUS_STEPS[step]}</span>
    </div>
  );
}

function MessageBubble({ role, text, isError, isDark }) {
  const isUser = role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? 'bg-orange-500 text-white rounded-br-sm'
            : isError
              ? 'bg-red-50 text-red-700 border border-red-100 rounded-bl-sm'
              : isDark
                ? 'bg-white/10 text-slate-100 border border-white/10 rounded-bl-sm'
                : 'bg-slate-100 text-slate-800 rounded-bl-sm'
        }`}
      >
        {text}
      </div>
    </div>
  );
}

export default function ChatPanel({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const period = useTimeOfDay();
  const reduceMotion = useReducedMotion();
  const isDark = skyTheme[period].isDark;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  async function handleSend(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await client.post('/chat', { message: text, history });
      setMessages((prev) => [...prev, { role: 'model', text: data.reply }]);
    } catch (err) {
      const errText = err.response?.data?.message || "Something went wrong reaching the assistant. Try again in a moment.";
      setMessages((prev) => [...prev, { role: 'model', text: errText, isError: true }]);
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center px-4 py-6 sm:py-10"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className={`relative overflow-hidden bg-gradient-to-b transition-colors duration-700 ${skyTheme[period].gradient} rounded-2xl shadow-2xl w-full max-w-lg h-[min(640px,85vh)] flex flex-col`}
      >
        <SkyBackground period={period} reduceMotion={reduceMotion} />

        <div className={`relative z-10 flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b backdrop-blur-sm ${isDark ? 'border-white/10 bg-slate-900/30' : 'border-slate-900/10 bg-white/40'}`}>
          <div>
            <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Train<span className="text-orange-500">Mitra</span> Assistant
            </p>
            <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Crowdsourced info, not guaranteed fact</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close chat"
            className={`w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full transition-colors ${
              isDark ? 'text-slate-300 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-900/5 hover:text-slate-700'
            }`}
          >
            <CloseIcon />
          </button>
        </div>

        <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3">
          <MessageBubble role="model" text={WELCOME_TEXT} isDark={isDark} />
          {messages.map((m, i) => (
            <MessageBubble key={i} role={m.role} text={m.text} isError={m.isError} isDark={isDark} />
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className={`rounded-2xl rounded-bl-sm ${isDark ? 'bg-white/10 border border-white/10' : 'bg-slate-100'}`}>
                <TypingDots isDark={isDark} />
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={handleSend}
          className={`relative z-10 flex items-center gap-2 px-4 sm:px-5 py-3.5 border-t ${isDark ? 'border-white/10' : 'border-slate-900/10 bg-white/40 backdrop-blur-sm'}`}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about a train, Tatkal, delays..."
            maxLength={1000}
            className={`flex-1 min-w-0 text-sm rounded-full border px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-300 ${
              isDark ? 'bg-white/10 border-white/20 text-white placeholder-slate-400' : 'bg-white border-slate-200 text-slate-900'
            }`}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-40 disabled:hover:bg-orange-500 transition-colors"
          >
            <SendIcon />
          </button>
        </form>
      </motion.div>
    </motion.div>,
    document.body
  );
}
