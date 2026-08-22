import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { changeLanguage, SUPPORTED_LANGUAGES } from '../i18n';

function GlobeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function badgeButtonClass() {
  return 'inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full pl-2.5 pr-3.5 py-1.5 shadow-lg shadow-black/20 border border-white/10 whitespace-nowrap hover:bg-slate-900/95 transition-colors';
}

function BadgeLabel({ label }) {
  return (
    <>
      <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-cyan-400/20 text-cyan-300">
        <GlobeIcon />
      </span>
      <span className="text-xs font-semibold text-slate-200">{label}</span>
    </>
  );
}

function hasHoverSupport() {
  return typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

const PANEL_WIDTH = 220;
const VIEWPORT_MARGIN = 16;

export default function LanguageBadge({ className = '' }) {
  const { t, i18n } = useTranslation();
  const [canHover] = useState(hasHoverSupport);
  const [open, setOpen] = useState(false);
  const [panelStyle, setPanelStyle] = useState(null);
  const containerRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return undefined;

    function reposition() {
      const rect = buttonRef.current.getBoundingClientRect();
      const width = Math.min(PANEL_WIDTH, window.innerWidth - VIEWPORT_MARGIN * 2);
      const idealLeft = rect.left + rect.width / 2 - width / 2;
      const left = Math.max(VIEWPORT_MARGIN, Math.min(idealLeft, window.innerWidth - width - VIEWPORT_MARGIN));
      setPanelStyle({ position: 'fixed', top: rect.bottom + 8, left, width });
    }

    reposition();
    window.addEventListener('resize', reposition);
    return () => window.removeEventListener('resize', reposition);
  }, [open]);

  function handleSelect(code) {
    changeLanguage(code);
    setOpen(false);
  }

  const containerProps = canHover
    ? { onMouseEnter: () => setOpen(true), onMouseLeave: () => setOpen(false) }
    : {};

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`} {...containerProps}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={badgeButtonClass()}
      >
        <BadgeLabel label={t('language.label')} />
      </button>

      <AnimatePresence>
        {open && panelStyle && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={panelStyle}
            className="z-30 rounded-2xl bg-white text-left shadow-2xl shadow-black/20 border border-slate-100 p-2 max-h-[70vh] overflow-y-auto"
          >
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide px-2.5 pt-1.5 pb-2">
              {t('language.choose')}
            </p>
            <div className="space-y-0.5">
              {SUPPORTED_LANGUAGES.map((code) => {
                const active = i18n.language === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleSelect(code)}
                    className={`w-full flex items-center justify-between gap-2 text-left px-2.5 py-2 rounded-xl text-sm transition-colors ${
                      active ? 'bg-orange-50 text-orange-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {t(`language.names.${code}`)}
                    {active && <CheckIcon />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
