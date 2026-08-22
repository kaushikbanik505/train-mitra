import { useEffect, useState } from 'react';

export default function StationClock({ size = 34 }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const seconds = now.getSeconds();
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6;
  const hourDeg = hours * 30;

  const toXY = (deg, length) => ({
    x: 20 + length * Math.sin((deg * Math.PI) / 180),
    y: 20 - length * Math.cos((deg * Math.PI) / 180),
  });

  const hourHand = toXY(hourDeg, 8);
  const minuteHand = toXY(minuteDeg, 12);
  const secondHand = toXY(secondDeg, 14.5);

  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className="shrink-0" aria-label="Live clock">
      <circle cx="20" cy="20" r="19" fill="#ffffff" stroke="#1f2937" strokeWidth="2" />
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const x1 = 20 + 16 * Math.sin(angle);
        const y1 = 20 - 16 * Math.cos(angle);
        const x2 = 20 + 13.3 * Math.sin(angle);
        const y2 = 20 - 13.3 * Math.cos(angle);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#1f2937" strokeWidth="1.3" />
        );
      })}
      <line x1="20" y1="20" x2={hourHand.x} y2={hourHand.y} stroke="#1f2937" strokeWidth="2.3" strokeLinecap="round" />
      <line x1="20" y1="20" x2={minuteHand.x} y2={minuteHand.y} stroke="#1f2937" strokeWidth="1.7" strokeLinecap="round" />
      <line x1="20" y1="20" x2={secondHand.x} y2={secondHand.y} stroke="#f97316" strokeWidth="1" strokeLinecap="round" />
      <circle cx="20" cy="20" r="1.5" fill="#f97316" />
    </svg>
  );
}
