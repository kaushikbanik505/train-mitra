import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import useOnlineStatus from '../hooks/useOnlineStatus';
import useQueueCount from '../hooks/useQueueCount';

function CloudOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 2 20 20" />
      <path d="M9.5 4.5A7 7 0 0 1 20 11c1.7.2 3 1.7 3 3.5a3.5 3.5 0 0 1-.5 1.8" />
      <path d="M5 8.6A5.5 5.5 0 0 0 6.5 19H18" />
    </svg>
  );
}

function SyncIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

export default function OfflineBanner() {
  const { t } = useTranslation();
  const isOnline = useOnlineStatus();
  const pendingCount = useQueueCount();
  const reduceMotion = useReducedMotion();

  const visible = !isOnline || pendingCount > 0;
  if (!visible) return null;

  const message = !isOnline
    ? pendingCount > 0
      ? t('offline.offlineWithQueue', { count: pendingCount })
      : t('offline.offline')
    : t('offline.sending', { count: pendingCount });

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4"
      >
        <div
          className={`flex items-center gap-2 text-xs font-semibold px-3.5 py-2 rounded-full shadow-lg border backdrop-blur ${
            isOnline
              ? 'bg-slate-900/90 text-amber-200 border-amber-400/30'
              : 'bg-slate-900/90 text-slate-200 border-white/10'
          }`}
        >
          {isOnline ? <SyncIcon /> : <CloudOffIcon />}
          <span>{message}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
