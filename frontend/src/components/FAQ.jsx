import { useState, useRef, useLayoutEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useTimeOfDay from '../hooks/useTimeOfDay';
import { skyTheme } from './SkyBackground';

// The actual core tone from each period's Hero sky gradient (skyTheme in
// SkyBackground.jsx) - not an invented palette, so the circle is genuinely
// the same color family as the rest of the landing page at that time of day.
// Text switches light/dark per skyTheme[period].isDark, same as Hero does.
const CIRCLE_CORE = {
  morning: '#38bdf8', // sky-400, matches morning's sky-200 hero tone
  noon: '#0ea5e9', // sky-500, a touch richer than morning for midday brightness
  evening: '#fb923c', // orange-400, matches evening's orange-200 hero tone
  night: '#0f172a', // slate-900, matches night's slate-950/indigo-950 hero tone
};

// A single accent color for "questions" that reads clearly against every
// CIRCLE_CORE tone (blue, orange, navy) - orange-on-orange during evening was
// the problem case that ruled out using the brand orange here.

function ChevronIcon({ open }) {
  return (
    <motion.svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      animate={{ rotate: open ? 180 : 0 }}
      transition={{ duration: 0.2 }}
      className="flex-shrink-0"
    >
      <path d="m6 9 6 6 6-6" />
    </motion.svg>
  );
}

function QuestionMarkIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function FAQItem({ item, isOpen, onToggle, reduceMotion }) {
  return (
    <div
      className={`rounded-xl border bg-white overflow-hidden transition-colors ${
        isOpen ? 'border-orange-200 shadow-sm' : 'border-slate-200'
      }`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-3 text-left px-4 sm:px-5 py-4 transition-colors ${
          isOpen ? 'text-orange-700' : 'text-slate-800 hover:text-orange-600'
        }`}
      >
        <span className="text-sm sm:text-[15px] font-semibold">{item.q}</span>
        <ChevronIcon open={isOpen} />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="px-4 sm:px-5 pb-4 text-sm text-slate-600 leading-relaxed">{item.a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQ() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const period = useTimeOfDay();
  const isDark = skyTheme[period]?.isDark ?? false;
  const circleCore = CIRCLE_CORE[period] ?? CIRCLE_CORE.noon;
  const [sectionOpen, setSectionOpen] = useState(false);
  const [openIndex, setOpenIndex] = useState(null);
  const faqs = t('faq.items', { returnObjects: true });

  // The shape hugs the actual content: generous side padding (the wide
  // subheading line needs it) but tight top/bottom padding - a true circle
  // sized to the content's diagonal wasted a lot of vertical space above the
  // heading and below the button, since the content is much wider than tall.
  const introRef = useRef(null);
  const [shapeSize, setShapeSize] = useState({ width: 480, height: 260 });

  useLayoutEffect(() => {
    const el = introRef.current;
    if (!el) return undefined;
    function measure() {
      const rect = el.getBoundingClientRect();
      setShapeSize({
        width: Math.ceil(rect.width + 90),
        height: Math.ceil(rect.height + 50),
      });
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  return (
    <section id="faq" className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-amber-50/50 to-white py-16 sm:py-24">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -top-16 -left-20 w-72 h-72 rounded-full bg-orange-200/40 blur-3xl"
        animate={reduceMotion ? {} : { scale: [1, 1.15, 1], x: [0, 15, 0], y: [0, 10, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute bottom-0 -right-20 w-72 h-72 rounded-full bg-amber-200/35 blur-3xl"
        animate={reduceMotion ? {} : { scale: [1, 1.2, 1], x: [0, -15, 0], y: [0, -10, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative max-w-2xl mx-auto px-4">
        {/* The wrapper reserves exactly shapeSize.height, so the accordion list
            below always clears the shape regardless of its size - no more
            guessing margins by hand. */}
        <div className="relative flex items-center justify-center mb-8" style={{ minHeight: shapeSize.height }}>
          <div
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-1/2 rounded-full transition-[background,box-shadow] duration-1000"
            style={{
              width: shapeSize.width,
              height: shapeSize.height,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(ellipse closest-side, ${circleCore} 0%, ${circleCore} 78%, transparent 100%)`,
              boxShadow: `0 0 70px 20px ${circleCore}55`,
            }}
          />

          <div ref={introRef} className="relative z-10 text-center px-8 py-4">
            <h2 className={`text-2xl sm:text-3xl font-bold mb-2 transition-colors duration-1000 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('faq.headingPrefix')} <span className="text-white transition-colors duration-1000" style={{ textShadow: isDark ? 'none' : '0 1px 6px rgba(0,0,0,0.25)' }}>{t('faq.headingHighlight')}</span>?
            </h2>
            <p className={`text-sm sm:text-base transition-colors duration-1000 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              {t('faq.subheading')}
            </p>

            <div className="flex justify-center mt-6">
              <motion.button
                type="button"
                onClick={() => setSectionOpen((o) => !o)}
                aria-expanded={sectionOpen}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className={`inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full transition-colors duration-300 ${
                  sectionOpen
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : isDark
                    ? 'bg-white/5 text-slate-200 border border-white/10 hover:border-orange-400/40 hover:text-orange-300'
                    : 'bg-white/70 text-slate-700 border border-white/60 shadow-sm hover:border-orange-300 hover:text-orange-600'
                }`}
              >
                <QuestionMarkIcon />
                {t('faq.toggleButton')}
                <ChevronIcon open={sectionOpen} />
              </motion.button>
            </div>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {sectionOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-2.5 pt-4 pb-1">
                {faqs.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: reduceMotion ? 0 : i * 0.05 }}
                  >
                    <FAQItem
                      item={item}
                      isOpen={openIndex === i}
                      onToggle={() => setOpenIndex((cur) => (cur === i ? null : i))}
                      reduceMotion={reduceMotion}
                    />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
