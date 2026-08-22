import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { isLearnerOwner } from '../constants/access';

function GraduationIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 10-10-5L2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" />
    </svg>
  );
}

export default function LearnerBadge({ className = '' }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showComingSoon, setShowComingSoon] = useState(false);

  function handleClick() {
    if (isLearnerOwner(user)) {
      navigate('/learner');
      return;
    }
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 1800);
  }

  return (
    <div className="relative inline-flex">
      <AnimatePresence>
        {showComingSoon && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-slate-100 text-xs font-medium px-3 py-1.5 rounded-full shadow-lg border border-white/10"
          >
            Coming soon
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full pl-2.5 pr-3.5 py-1.5 shadow-lg shadow-black/20 border border-white/10 whitespace-nowrap hover:bg-slate-900/95 transition-colors ${className}`}
      >
        <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-fuchsia-400/20 text-fuchsia-300">
          <GraduationIcon />
        </span>
        <span className="text-xs font-semibold text-slate-200">Learner</span>
      </button>
    </div>
  );
}
