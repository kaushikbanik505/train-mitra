import { useNavigate } from 'react-router-dom';

function CompassIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
    </svg>
  );
}

export default function WhatsNextBadge({ className = '' }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/whats-next')}
      className={`inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full pl-2.5 pr-3.5 py-1.5 shadow-lg shadow-black/20 border border-white/10 whitespace-nowrap hover:bg-slate-900/95 transition-colors ${className}`}
    >
      <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-amber-400/20 text-amber-300">
        <CompassIcon />
      </span>
      <span className="text-xs font-semibold text-slate-200">What's Next</span>
    </button>
  );
}
