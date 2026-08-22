import { useState } from 'react';
import { Link } from 'react-router-dom';

export function BackArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M11 18l-6-6 6-6" />
    </svg>
  );
}

export function BackLink({ to = '/', children = 'Back to home', isDark = false }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors mb-6 ${
        isDark ? 'text-slate-300 hover:text-orange-300' : 'text-slate-500 hover:text-orange-600'
      }`}
    >
      <BackArrow /> {children}
    </Link>
  );
}

function CopyIcon({ copied }) {
  return copied ? (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  ) : (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function CodeLine({ text }) {
  const isComment = text.trim().startsWith('//');
  return <div className={isComment ? 'text-slate-500' : 'text-slate-100'}>{text || ' '}</div>;
}

export function CodeBlock({ file, code, defaultOpen = false }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const lineCount = code.split('\n').length;

  function handleCopy(e) {
    e.stopPropagation();
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div className="rounded-xl overflow-hidden border border-slate-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full bg-slate-800 text-slate-300 text-xs font-mono px-4 py-2 flex items-center justify-between gap-2 hover:bg-slate-700 transition-colors"
      >
        <span className="flex items-center gap-2 min-w-0">
          <ChevronIcon open={open} />
          <span className="truncate">{file}</span>
          <span className="text-slate-500 font-sans flex-shrink-0">({lineCount} lines)</span>
        </span>
        <span
          onClick={handleCopy}
          role="button"
          tabIndex={0}
          aria-label="Copy code"
          className="flex-shrink-0 flex items-center gap-1 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <CopyIcon copied={copied} />
          <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
        </span>
      </button>
      {open && (
        <div className="bg-slate-900 px-4 py-3 overflow-x-auto max-h-[600px] overflow-y-auto">
          <pre className="font-mono text-[12.5px] leading-relaxed whitespace-pre">
            {code.split('\n').map((line, i) => (
              <CodeLine key={i} text={line} />
            ))}
          </pre>
        </div>
      )}
    </div>
  );
}

function StarIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="flex-shrink-0">
      <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z" />
    </svg>
  );
}

function ratingStyle(rating) {
  if (rating >= 9) return 'bg-rose-50 text-rose-700';
  if (rating >= 7) return 'bg-orange-50 text-orange-700';
  if (rating >= 5) return 'bg-amber-50 text-amber-700';
  if (rating >= 3) return 'bg-sky-50 text-sky-700';
  return 'bg-slate-100 text-slate-500';
}

export function RatingBadge({ rating }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${ratingStyle(rating)}`}>
      <StarIcon />
      {rating}/10
    </span>
  );
}

export function FileCard({ path, rating, explanation, code, isDark = false }) {
  return (
    <div className={`rounded-2xl border p-4 sm:p-5 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <code className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{path}</code>
        <RatingBadge rating={rating} />
      </div>
      <div className="space-y-2.5 mb-4">
        {explanation.map((p, i) => (
          <p key={i} className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{p}</p>
        ))}
      </div>
      <CodeBlock file={path} code={code} />
    </div>
  );
}
