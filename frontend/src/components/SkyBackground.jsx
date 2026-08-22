import { useMemo } from 'react';
import { motion } from 'framer-motion';

export const skyTheme = {
  morning: {
    gradient: 'from-sky-200 via-orange-100 to-orange-50',
    isDark: false,
  },
  noon: {
    gradient: 'from-sky-300 via-sky-100 to-orange-50',
    isDark: false,
  },
  evening: {
    gradient: 'from-orange-200 via-orange-100/60 to-slate-50',
    isDark: false,
  },
  night: {
    gradient: 'from-slate-950 via-indigo-950 to-slate-900',
    isDark: true,
  },
};

const sunStyles = {
  morning: { size: 84, glow: 'rgba(251,191,36,0.55)', core: '#fde68a', className: 'top-28 right-10 sm:top-32 sm:right-16' },
  noon: { size: 64, glow: 'rgba(253,224,71,0.55)', core: '#fef9c3', className: 'top-4 right-10 sm:top-6 sm:right-24' },
  evening: { size: 92, glow: 'rgba(249,115,22,0.5)', core: '#fdba74', className: 'top-16 right-8 sm:top-20 sm:right-20' },
};

function Sun({ period, reduceMotion }) {
  const s = sunStyles[period];
  if (!s) return null;

  return (
    <motion.div
      aria-hidden
      className={`pointer-events-none absolute rounded-full hidden sm:block ${s.className}`}
      style={{
        width: s.size,
        height: s.size,
        background: s.core,
        boxShadow: `0 0 60px 30px ${s.glow}`,
      }}
      initial={{ opacity: 0, y: reduceMotion ? 0 : 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    />
  );
}

function CrescentMoon({ reduceMotion }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute top-4 right-6 sm:top-6 sm:right-14 hidden sm:block"
      style={{ filter: 'drop-shadow(0 0 10px rgba(226,232,240,0.45))' }}
      initial={{ opacity: 0, y: reduceMotion ? 0 : -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
    >
      <svg width="52" height="52" viewBox="0 0 56 56">
        <mask id="moon-mask">
          <rect width="56" height="56" fill="black" />
          <circle cx="28" cy="28" r="20" fill="white" />
          <circle cx="37" cy="20" r="18" fill="black" />
        </mask>
        <circle cx="28" cy="28" r="20" fill="#f1f5f9" mask="url(#moon-mask)" />
      </svg>
    </motion.div>
  );
}

function StarField({ reduceMotion }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 160 }, () => ({
        top: `${Math.random() * 90}%`,
        left: `${Math.random() * 100}%`,
        size: Math.random() < 0.7 ? 1.3 : Math.random() < 0.93 ? 2.2 : 3,
        duration: 2 + Math.random() * 3,
        delay: Math.random() * 4,
      })),
    []
  );

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {stars.map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size }}
          animate={reduceMotion ? {} : { opacity: [0.2, 1, 0.2] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function ShootingStar({ delay, top, length, angle, duration, repeatDelay }) {
  return (
    <motion.div
      aria-hidden
      className="absolute h-px bg-gradient-to-r from-transparent via-white to-transparent"
      style={{ top, left: '-6rem', width: length, rotate: `${angle}deg` }}
      animate={{
        x: ['0vw', '130vw'],
        opacity: [0, 1, 1, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        repeatDelay,
        delay,
        ease: 'easeIn',
        times: [0, 0.1, 0.7, 1],
      }}
    />
  );
}

function MeteorShower({ reduceMotion }) {
  const meteors = useMemo(
    () =>
      Array.from({ length: 11 }, () => ({
        top: `${5 + Math.random() * 45}%`,
        length: 70 + Math.random() * 50,
        angle: 15 + Math.random() * 15,
        duration: 0.8 + Math.random() * 0.5,
        delay: Math.random() * 0.7,
      })),
    []
  );

  if (reduceMotion) return null;

  return (
    <>
      {meteors.map((m, i) => (
        <ShootingStar key={i} {...m} repeatDelay={3.2} />
      ))}
    </>
  );
}

function BirdIcon({ size = 20, color = '#4a3234' }) {
  return (
    <svg width={size} height={size * 0.45} viewBox="0 0 20 9" className="block">
      <path
        d="M0,7 Q5,0 10,7 Q15,0 20,7"
        stroke={color}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

const flockLayout = [
  { top: 0, left: 0, size: 22 },
  { top: 6, left: 22, size: 18 },
  { top: -8, left: 26, size: 16 },
  { top: 4, left: 46, size: 20 },
  { top: -4, left: 66, size: 15 },
];

function BirdFlock({ topPercent, duration, delay, reduceMotion }) {
  return (
    <motion.div
      aria-hidden
      className="absolute hidden sm:block"
      style={{ top: topPercent, width: 90, height: 30 }}
      initial={{ left: '-12%' }}
      animate={reduceMotion ? {} : { left: '112%' }}
      transition={{ duration, repeat: Infinity, ease: 'linear', delay }}
    >
      <motion.div
        className="relative w-full h-full"
        animate={reduceMotion ? {} : { y: [0, -4, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {flockLayout.map((b, i) => (
          <div key={i} className="absolute" style={{ top: b.top, left: b.left }}>
            <BirdIcon size={b.size} />
          </div>
        ))}
      </motion.div>
    </motion.div>
  );
}

function EveningBirds({ reduceMotion }) {
  return (
    <>
      <BirdFlock topPercent="14%" duration={26} delay={0} reduceMotion={reduceMotion} />
      <BirdFlock topPercent="24%" duration={32} delay={6} reduceMotion={reduceMotion} />
    </>
  );
}

export default function SkyBackground({ period, reduceMotion }) {
  const isDark = skyTheme[period]?.isDark;

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      {isDark ? (
        <>
          <StarField reduceMotion={reduceMotion} />
          <CrescentMoon reduceMotion={reduceMotion} />
          <MeteorShower reduceMotion={reduceMotion} />
        </>
      ) : (
        <>
          <Sun period={period} reduceMotion={reduceMotion} />
          {period === 'evening' && <EveningBirds reduceMotion={reduceMotion} />}
        </>
      )}
    </div>
  );
}
