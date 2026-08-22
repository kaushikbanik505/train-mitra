import { motion, useReducedMotion } from 'framer-motion';

function SmokePuff({ delay }) {
  return (
    <motion.circle
      r="2"
      fill="#94a3b8"
      initial={{ opacity: 0, cx: 0, cy: 0 }}
      animate={{
        opacity: [0, 0.85, 0],
        cy: [0, -18, -36],
        cx: [0, -9, -20],
        r: [2, 6, 9],
      }}
      transition={{
        duration: 2.2,
        repeat: Infinity,
        delay,
        ease: 'easeOut',
      }}
    />
  );
}

function Tree({ left, size = 18, color = '#4ade80' }) {
  return (
    <div className="absolute bottom-[18px] pointer-events-none" style={{ left }}>
      <svg width={size} height={size * 1.4} viewBox="0 0 16 22">
        <polygon points="8,0 13,8 3,8" fill={color} />
        <polygon points="8,5 14,13 2,13" fill={color} />
        <polygon points="8,10 15,19 1,19" fill={color} />
        <rect x="6.5" y="18" width="3" height="4" fill="#78350f" />
      </svg>
    </div>
  );
}

function StreetLight({ left, delay = 0 }) {
  return (
    <div className="absolute bottom-[18px] pointer-events-none flex flex-col items-center" style={{ left }}>
      <div className="relative flex items-center justify-center" style={{ width: 16, height: 16 }}>
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 16,
            height: 16,
            background: 'radial-gradient(closest-side, rgba(253,224,71,0.85), rgba(253,224,71,0) 70%)',
          }}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.6, repeat: Infinity, delay, ease: 'easeInOut' }}
        />
        <div
          className="relative rounded-full"
          style={{ width: 5, height: 5, backgroundColor: '#fde68a', boxShadow: '0 0 5px 2px rgba(253,224,71,0.9)' }}
        />
      </div>
      <div style={{ width: 1.5, height: 16 }} className="bg-slate-500" />
      <div style={{ width: 7, height: 1.5 }} className="bg-slate-500 rounded-full" />
    </div>
  );
}

function SignalLight({ left }) {
  return (
    <div className="absolute bottom-[18px] pointer-events-none flex flex-col items-center" style={{ left }}>
      <div className="relative flex items-center justify-center rounded-sm bg-slate-800" style={{ width: 8, height: 9 }}>
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 12,
            height: 12,
            background: 'radial-gradient(closest-side, rgba(239,68,68,0.8), rgba(239,68,68,0) 70%)',
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div
          className="relative rounded-full"
          style={{ width: 4, height: 4, backgroundColor: '#ef4444', boxShadow: '0 0 4px 1.5px rgba(239,68,68,0.9)' }}
        />
      </div>
      <div style={{ width: 1.5, height: 15 }} className="bg-slate-500" />
      <div style={{ width: 7, height: 1.5 }} className="bg-slate-500 rounded-full" />
    </div>
  );
}

function Station({ left }) {
  return (
    <div className="absolute bottom-[18px] pointer-events-none" style={{ left }}>
      <svg width="38" height="26" viewBox="0 0 38 26">
        {/* flat cantilevered canopy */}
        <rect x="0" y="4" width="38" height="2.5" rx="1" fill="#334155" />
        <rect x="3" y="6.5" width="2" height="2.5" fill="#64748b" />
        <rect x="33" y="6.5" width="2" height="2.5" fill="#64748b" />

        {/* main building block */}
        <rect x="6" y="9" width="26" height="17" rx="1.5" fill="#e2e8f0" />
        <rect x="6" y="9" width="26" height="17" rx="1.5" fill="none" stroke="#94a3b8" strokeWidth="0.75" />

        {/* glass facade panels */}
        <rect x="9" y="12" width="4" height="8" fill="#93c5fd" />
        <rect x="14.5" y="12" width="4" height="8" fill="#93c5fd" />
        <rect x="20" y="12" width="4" height="8" fill="#93c5fd" />
        <rect x="25.5" y="12" width="3.5" height="8" fill="#93c5fd" />

        {/* entrance */}
        <rect x="15.5" y="20.5" width="6" height="5.5" fill="#1e293b" />
      </svg>
    </div>
  );
}

export function TrainIcon() {
  return (
    <svg width="72" height="40" viewBox="0 0 72 40" className="overflow-visible">
      <g transform="translate(14, 6)">
        <SmokePuff delay={0} />
        <SmokePuff delay={0.7} />
        <SmokePuff delay={1.4} />
      </g>

      {/* chimney */}
      <rect x="10" y="6" width="7" height="10" rx="1.5" fill="#3f2a2a" />
      {/* cab / body */}
      <rect x="4" y="14" width="56" height="18" rx="4" fill="#4a3234" />
      {/* windows */}
      <rect x="12" y="18" width="9" height="8" rx="1.5" fill="#a8c5d6" />
      <rect x="26" y="18" width="9" height="8" rx="1.5" fill="#a8c5d6" />
      <rect x="40" y="18" width="9" height="8" rx="1.5" fill="#a8c5d6" />
      {/* nose */}
      <rect x="58" y="18" width="10" height="14" rx="4" fill="#4a3234" />
      {/* wheels */}
      {[14, 30, 46, 60].map((cx) => (
        <motion.g
          key={cx}
          animate={{ rotate: 360 }}
          transition={{ duration: 0.6, repeat: Infinity, ease: 'linear' }}
        >
          <circle cx={cx} cy="34" r="4.5" fill="#1f1f1f" />
          <line x1={cx} y1="30" x2={cx} y2="38" stroke="#64748b" strokeWidth="1" />
          <line x1={cx - 4} y1="34" x2={cx + 4} y2="34" stroke="#64748b" strokeWidth="1" />
        </motion.g>
      ))}
    </svg>
  );
}

export default function TrainTrack() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mt-14 sm:mt-20 h-16 sm:h-20 overflow-hidden">
      {/* trackside lamps */}
      <StreetLight left="3%" delay={0} />
      <StreetLight left="13%" delay={0.3} />
      <StreetLight left="23%" delay={0.6} />
      <StreetLight left="33%" delay={0.9} />
      <StreetLight left="43%" delay={1.2} />
      <StreetLight left="58%" delay={0.2} />
      <StreetLight left="68%" delay={0.5} />
      <StreetLight left="78%" delay={0.8} />
      <StreetLight left="88%" delay={1.1} />
      <StreetLight left="96%" delay={1.4} />

      {/* trees along the track */}
      <Tree left="8%" size={16} color="#6ee7a8" />
      <Tree left="18%" size={19} color="#4ade80" />
      <Tree left="38%" size={17} color="#6ee7a8" />
      <Tree left="53%" size={20} color="#4ade80" />
      <Tree left="73%" size={16} color="#6ee7a8" />

      {/* red signal posts at the start, middle, and end */}
      <SignalLight left="1%" />
      <SignalLight left="49%" />
      <SignalLight left="97%" />
      <Tree left="92%" size={18} color="#4ade80" />

      {/* stations, sitting in the open gaps between lamps/trees */}
      <Station left="28%" />
      <Station left="82%" />

      {/* railway track: two rails + sleepers, aligned to sit right under the wheels */}
      <div className="absolute inset-x-0 bottom-[10px] h-2">
        <div
          className="absolute inset-x-0 top-0 h-full opacity-80"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, #fdba74 0px, #fdba74 4px, transparent 4px, transparent 12px)',
          }}
        />
        <div className="absolute inset-x-0 top-0 h-[1.5px] bg-orange-300 rounded-full" />
        <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-orange-300 rounded-full" />
      </div>

      {!reduceMotion ? (
        <motion.div
          className="absolute bottom-2"
          initial={{ left: '-10%' }}
          animate={{ left: ['-10%', '28%', '28%', '82%', '82%', '108%'] }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'linear',
            times: [0, 0.279, 0.346, 0.742, 0.809, 1],
          }}
        >
          <motion.div
            animate={{ y: [0, -1.5, 0, -1.5, 0] }}
            transition={{ duration: 0.3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <TrainIcon />
          </motion.div>
        </motion.div>
      ) : (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
          <TrainIcon />
        </div>
      )}
    </div>
  );
}
