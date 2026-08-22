import { useNavigate } from 'react-router-dom';

function ShieldIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
    </svg>
  );
}

export default function AdminBadge({ className = '' }) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/admin')}
      className={`inline-flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm text-white rounded-full pl-2.5 pr-3.5 py-1.5 shadow-lg shadow-black/20 border border-white/10 whitespace-nowrap hover:bg-slate-900/95 transition-colors ${className}`}
    >
      <span className="flex items-center justify-center w-3.5 h-3.5 rounded-full bg-rose-400/20 text-rose-300">
        <ShieldIcon />
      </span>
      <span className="text-xs font-semibold text-slate-200">Admin</span>
    </button>
  );
}
