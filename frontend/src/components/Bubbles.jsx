import { useMemo } from 'react';
import { motion } from 'framer-motion';

const BUBBLE_COUNT = 30;

export default function Bubbles({ reduceMotion }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: BUBBLE_COUNT }, () => {
        const drift = (20 + Math.random() * 50) * (Math.random() < 0.5 ? -1 : 1);
        return {
          left: `${Math.random() * 100}%`,
          size: 7 + Math.random() * 22,
          rise: 380 + Math.random() * 340,
          drift,
          duration: 5 + Math.random() * 6,
          delay: Math.random() * 6,
        };
      }),
    []
  );

  if (reduceMotion) return null;

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {bubbles.map((b, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: b.left,
            bottom: '-3%',
            width: b.size,
            height: b.size,
            background:
              'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.95), rgba(224,242,254,0.35) 55%, rgba(186,230,253,0.12) 78%)',
            border: '1.5px solid rgba(125,211,252,0.65)',
            boxShadow: '0 0 8px rgba(56,189,248,0.25), inset 0 0 4px rgba(255,255,255,0.6)',
          }}
          animate={{
            y: [0, -b.rise * 0.35, -b.rise * 0.75, -b.rise],
            x: [0, b.drift * 0.4, -b.drift * 0.4, b.drift],
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: b.duration,
            delay: b.delay,
            repeat: Infinity,
            ease: 'easeInOut',
            times: [0, 0.15, 0.85, 1],
          }}
        />
      ))}
    </div>
  );
}
