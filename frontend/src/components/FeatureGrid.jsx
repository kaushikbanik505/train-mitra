import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const ACCENTS = {
  sky: {
    icon: 'bg-sky-50 text-sky-600',
    border: 'from-sky-200 via-slate-200 to-sky-100',
    glow: 'group-hover:shadow-sky-400/20',
  },
  orange: {
    icon: 'bg-orange-50 text-orange-600',
    border: 'from-orange-200 via-slate-200 to-amber-200',
    glow: 'group-hover:shadow-orange-400/20',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-600',
    border: 'from-amber-200 via-slate-200 to-orange-200',
    glow: 'group-hover:shadow-amber-400/20',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-500',
    border: 'from-rose-200 via-slate-200 to-rose-100',
    glow: 'group-hover:shadow-rose-400/20',
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-500',
    border: 'from-indigo-200 via-slate-200 to-indigo-100',
    glow: 'group-hover:shadow-indigo-400/20',
  },
  teal: {
    icon: 'bg-teal-50 text-teal-600',
    border: 'from-teal-200 via-slate-200 to-teal-100',
    glow: 'group-hover:shadow-teal-400/20',
  },
};

const features = [
  { id: 'accounts', icon: '🔐', status: 'live', accent: 'sky' },
  { id: 'trainLookup', icon: '🔎', status: 'live', link: '/trains', accent: 'orange' },
  { id: 'tatkal', icon: '⏱️', status: 'live', link: '/trains?tatkal=1', accent: 'amber' },
  { id: 'delay', icon: '📣', status: 'live', link: '/trains?delay=1', accent: 'rose' },
  { id: 'liveStatus', icon: '🛰️', status: 'live', link: '/trains?live=1', accent: 'indigo' },
  { id: 'experience', icon: '💬', status: 'live', link: '/trains?experience=1', accent: 'teal' },
];

function bubbleStyle(size) {
  return {
    width: size,
    height: size,
    background: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95), rgba(191,219,254,0.35) 45%, rgba(125,211,252,0.15) 75%)',
    border: '1px solid rgba(125,211,252,0.55)',
    boxShadow: 'inset -2px -2px 4px rgba(56,189,248,0.25), inset 2px 2px 3px rgba(255,255,255,0.8)',
  };
}

function randomEdgePoint() {
  const edge = Math.floor(Math.random() * 4);
  if (edge === 0) return { x: Math.random() * 100, y: -8 }; // top
  if (edge === 1) return { x: Math.random() * 100, y: 108 }; // bottom
  if (edge === 2) return { x: -8, y: Math.random() * 100 }; // left
  return { x: 108, y: Math.random() * 100 }; // right
}

function randomInnerPoint() {
  return { x: 5 + Math.random() * 90, y: 5 + Math.random() * 90 };
}

function makeWanderingBubble(startPoint) {
  const points = [startPoint, randomInnerPoint(), randomInnerPoint(), randomEdgePoint()];
  return {
    id: Math.random().toString(36).slice(2),
    size: 8 + Math.random() * 30,
    duration: 3 + Math.random() * 2.5,
    delay: Math.random() * 2,
    xs: points.map((p) => `${p.x}%`),
    ys: points.map((p) => `${p.y}%`),
  };
}

function makeAmbientBubble() {
  return makeWanderingBubble(randomEdgePoint());
}

function makeHornBubble() {
  return makeWanderingBubble({ x: 50 + (Math.random() - 0.5) * 12, y: 14 + (Math.random() - 0.5) * 6 });
}

function Bubbles({ bubbles, reduceMotion }) {
  if (reduceMotion) return null;

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((b) => (
        <motion.span
          key={b.id}
          className="absolute rounded-full"
          style={bubbleStyle(b.size)}
          initial={{ left: b.xs[0], top: b.ys[0], opacity: 0 }}
          animate={{ left: b.xs, top: b.ys, opacity: [0, 0.85, 1, 0.85] }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            ease: 'easeInOut',
            repeat: Infinity,
            repeatType: 'mirror',
          }}
        />
      ))}
    </div>
  );
}

function HornIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10v4a1 1 0 0 0 1 1h2l5 4V5L6 9H4a1 1 0 0 0-1 1Z" />
      <path d="M16 8a5 5 0 0 1 0 8" />
      <path d="M19 5a9 9 0 0 1 0 14" />
    </svg>
  );
}

function playHornSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, now);
    master.gain.linearRampToValueAtTime(0.28, now + 0.04);
    master.gain.linearRampToValueAtTime(0.22, now + 0.5);
    master.gain.linearRampToValueAtTime(0, now + 0.85);
    master.connect(ctx.destination);

    [311.1, 370, 466.2].forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      osc.connect(master);
      osc.start(now);
      osc.stop(now + 0.9);
    });

    setTimeout(() => ctx.close(), 1000);
  } catch {
    // audio unavailable, ignore
  }
}

const MAX_HONK_STREAK = 6;
const MIC_BASE_SIZE = 18;
const MIC_GROWTH_PER_HONK = 9;
const HONK_STREAK_TIMEOUT = 1100;

function HornButton({ onHonk, t }) {
  const [streak, setStreak] = useState(0);
  const resetTimer = useRef(null);

  function handleHonk() {
    onHonk();
    playHornSound();

    setStreak((n) => Math.min(n + 1, MAX_HONK_STREAK));

    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStreak(0), HONK_STREAK_TIMEOUT);
  }

  const micSize = MIC_BASE_SIZE + streak * MIC_GROWTH_PER_HONK;

  return (
    <div className="inline-flex flex-col items-center mb-2">
      <div className="relative">
        <AnimatePresence>
          {streak > 0 && (
            <motion.div
              key="mic"
              className="absolute bottom-1/2 left-full ml-2 select-none leading-none"
              initial={{ opacity: 0, scale: 0.4, x: -10, fontSize: MIC_BASE_SIZE }}
              animate={{ opacity: 1, scale: 1, x: 0, fontSize: micSize }}
              exit={{ opacity: 0, scale: 0.4, x: -10 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              📢
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          type="button"
          onClick={handleHonk}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9, rotate: -8 }}
          aria-label="Sound the horn"
          className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-orange-200"
        >
          <HornIcon />
        </motion.button>
      </div>
      <span className="text-[11px] text-slate-400 mt-1">{t('featureGrid.hornHint')}</span>
    </div>
  );
}

function StatusBadge({ status, t }) {
  if (status === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full whitespace-nowrap">
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping-slow" />
          <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </span>
        {t('featureGrid.status.live')}
      </span>
    );
  }
  return (
    <span className="text-xs font-medium bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full whitespace-nowrap">
      {t('featureGrid.status.comingSoon')}
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

const MAX_BUBBLES = 90;

export default function FeatureGrid() {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [bubbles, setBubbles] = useState(() => Array.from({ length: 42 }, makeAmbientBubble));

  function handleHonk() {
    setBubbles((current) => {
      const next = [...current, ...Array.from({ length: 14 }, makeHornBubble)];
      return next.length > MAX_BUBBLES ? next.slice(next.length - MAX_BUBBLES) : next;
    });
  }

  return (
    <section
      id="features"
      className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 py-14 sm:py-20 scroll-mt-16"
    >
      {/* classic double rule along the top and bottom edges */}
      <div className="absolute inset-x-0 top-0">
        <div className="h-[3px] bg-gradient-to-r from-orange-400 via-rose-400 to-amber-400" />
        <div className="h-[3px]" />
        <div className="h-[1.5px] bg-gradient-to-r from-amber-200 via-orange-200 to-rose-200" />
      </div>
      <div className="absolute inset-x-0 bottom-0">
        <div className="h-[1.5px] bg-gradient-to-r from-rose-200 via-orange-200 to-amber-200" />
        <div className="h-[3px]" />
        <div className="h-[3px] bg-gradient-to-r from-amber-400 via-rose-400 to-orange-400" />
      </div>

      <Bubbles bubbles={bubbles} reduceMotion={reduceMotion} />

      <div className="relative max-w-5xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <HornButton onHonk={handleHonk} t={t} />
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
            {t('featureGrid.heading', { brand: 'TrainMitra' })}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 max-w-md mx-auto">
            {t('featureGrid.subheading')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {features.map((f, i) => {
          const CardTag = f.link ? Link : 'div';
          const isLive = f.status === 'live';
          const accent = ACCENTS[f.accent];
          return (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: reduceMotion ? 0 : i * 0.08, ease: 'easeOut' }}
              whileHover={{ y: -4 }}
              className="group h-full"
            >
              <CardTag
                {...(f.link ? { to: f.link } : {})}
                className={`relative block h-full rounded-2xl p-[1.5px] bg-gradient-to-br shadow-sm transition-shadow duration-300 ${
                  isLive ? `${accent.border} ${accent.glow} group-hover:shadow-lg` : 'from-slate-200 via-slate-100 to-slate-200'
                }`}
              >
                <div
                  className={`relative h-full rounded-[15px] p-5 bg-white transition-opacity ${
                    isLive ? '' : 'opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3.5">
                    <span
                      className={`text-2xl w-11 h-11 flex items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-105 ${
                        isLive ? accent.icon : 'bg-slate-100 text-slate-400 grayscale'
                      }`}
                    >
                      {f.icon}
                    </span>
                    <StatusBadge status={f.status} t={t} />
                  </div>
                  <h3 className="font-semibold text-slate-900 text-sm mb-1.5">{t(`featureGrid.items.${f.id}.title`)}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{t(`featureGrid.items.${f.id}.description`)}</p>
                  {f.link && (
                    <span className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-orange-600 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      {t('featureGrid.tryIt')} <ArrowIcon />
                    </span>
                  )}
                </div>
              </CardTag>
            </motion.div>
          );
        })}
        </div>
      </div>
    </section>
  );
}
