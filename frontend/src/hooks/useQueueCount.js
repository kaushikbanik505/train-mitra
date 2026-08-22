import { useEffect, useState } from 'react';
import { getQueue, onQueueChange } from '../offline/offlineQueue';

export default function useQueueCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    getQueue().then((queue) => setCount(queue.length));
    return onQueueChange((queue) => setCount(queue.length));
  }, []);

  return count;
}
