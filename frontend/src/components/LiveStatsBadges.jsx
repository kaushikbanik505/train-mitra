import { motion, AnimatePresence } from 'framer-motion';
import useLiveStats from '../hooks/useLiveStats';

function PulseDot({ colorClass }) {
  return (
    <span className="relative flex w-2 h-2 flex-shrink-0">
      <span className={`absolute inset-0 rounded-full animate-ping-slow ${colorClass}`} />
      <span className={`relative w-2 h-2 rounded-full ${colorClass}`} />
    </span>
  );
}

function LiveBadge({ value, label, dotColorClass }) {
  return (
    <AnimatePresence>
      {value !== null && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full pl-2.5 pr-3.5 py-1.5 shadow-lg shadow-black/20 border border-white/10 whitespace-nowrap"
        >
          <PulseDot colorClass={dotColorClass} />
          <span className="font-bold text-sm tabular-nums">{value.toLocaleString()}</span>
          <span className="text-xs text-slate-300">{label}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LiveStatsBadges({ className = '', direction = 'col' }) {
  const { online, registered } = useLiveStats();

  if (online === null && registered === null) return null;

  const directionClass = direction === 'row' ? 'flex-row flex-wrap justify-center lg:justify-start' : 'flex-col items-start';

  return (
    <div className={`flex ${directionClass} gap-2 ${className}`}>
      <LiveBadge value={online} label="online now" dotColorClass="bg-emerald-400" />
      <LiveBadge value={registered} label="registered" dotColorClass="bg-sky-400" />
    </div>
  );
}
