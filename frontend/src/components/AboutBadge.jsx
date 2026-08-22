import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { aboutSections } from '../content/aboutContent';

function InfoIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function badgeButtonClass() {
  return 'inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full pl-2.5 pr-3.5 py-1.5 shadow-lg shadow-black/20 border border-white/10 whitespace-nowrap hover:bg-slate-900/95 transition-colors';
}

function BadgeLabel() {
  return (
    <>
      <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-sky-400/20 text-sky-300">
        <InfoIcon />
      </span>
      <span className="text-xs font-semibold text-slate-200">About TrainMitra</span>
    </>
  );
}

function hasHoverSupport() {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

const PANEL_MAX_WIDTH = 368; // ~23rem
const VIEWPORT_MARGIN = 16;

export default function AboutBadge({ className = '' }) {
  const [canHover] = useState(hasHoverSupport);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!canHover) return undefined;
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [canHover]);

  useLayoutEffect(() => {
    if (!canHover || !open || !buttonRef.current) return undefined;

    function reposition() {
      const rect = buttonRef.current.getBoundingClientRect();
      const width = Math.min(PANEL_MAX_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
      const idealLeft = rect.left + rect.width / 2 - width / 2;
      const left = Math.max(VIEWPORT_MARGIN, Math.min(idealLeft, window.innerWidth - width - VIEWPORT_MARGIN));
      setPanelStyle({ position: 'fixed', top: rect.bottom + 8, left, width });
    }

    reposition();
    window.addEventListener('resize', reposition);
    return () => window.removeEventListener('resize', reposition);
  }, [canHover, open]);

  if (!canHover) {
    return (
      <button
        type="button"
        onClick={() => navigate('/about')}
        className={`${badgeButtonClass()} ${className}`}
      >
        <BadgeLabel />
      </button>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        className={badgeButtonClass()}
      >
        <BadgeLabel />
      </button>

      <AnimatePresence>
        {open && panelStyle && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={panelStyle}
            className="z-30 rounded-2xl bg-white text-left shadow-2xl shadow-black/20 border border-slate-100 p-4 sm:p-5 max-h-[70vh] overflow-y-auto"
          >
            <p className="text-sm font-bold text-slate-900 mb-3">
              Train<span className="text-orange-500">Mitra</span>, in short
            </p>
            <div className="space-y-3">
              {aboutSections.map((s) => (
                <div key={s.heading}>
                  <p className="text-[11px] font-semibold text-orange-600 uppercase tracking-wide mb-0.5">{s.heading}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-[11px] text-slate-400">Designed &amp; developed by Kaushik Banik</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
