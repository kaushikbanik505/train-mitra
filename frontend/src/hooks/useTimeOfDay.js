import { useEffect, useState } from 'react';

function getPeriod(hour) {
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'noon';
  if (hour >= 16 && hour < 19) return 'evening';
  return 'night';
}

export default function useTimeOfDay() {
  const [period, setPeriod] = useState(() => getPeriod(new Date().getHours()));

  useEffect(() => {
    const interval = setInterval(() => {
      setPeriod(getPeriod(new Date().getHours()));
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return period;
}
