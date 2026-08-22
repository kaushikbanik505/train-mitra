import { useNavigate } from 'react-router-dom';

function CodeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m8 6-6 6 6 6M16 6l6 6-6 6" />
    </svg>
  );
}

export default function DeveloperBadge({ className = '' }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/developer')}
      className={`inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full pl-2.5 pr-3.5 py-1.5 shadow-lg shadow-black/20 border border-white/10 whitespace-nowrap hover:bg-slate-900/95 transition-colors ${className}`}
    >
      <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-violet-400/20 text-violet-300">
        <CodeIcon />
      </span>
      <span className="text-xs font-semibold text-slate-200">Developer</span>
    </button>
  );
}
