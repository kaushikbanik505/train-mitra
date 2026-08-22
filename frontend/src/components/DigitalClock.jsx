import { useEffect, useState } from 'react';

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function DigitalClock({ className = '' }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const h = pad(now.getHours());
  const m = pad(now.getMinutes());
  const s = pad(now.getSeconds());
  const blink = now.getSeconds() % 2 === 0;

  return (
    <div
      className={`inline-flex items-center gap-0.5 bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 font-mono text-sm sm:text-base tracking-widest text-amber-400 ${className}`}
      style={{ textShadow: '0 0 8px rgba(251,191,36,0.55)' }}
    >
      <span>{h}</span>
      <span style={{ opacity: blink ? 1 : 0.25 }}>:</span>
      <span>{m}</span>
      <span style={{ opacity: blink ? 1 : 0.25 }}>:</span>
      <span>{s}</span>
    </div>
  );
}
