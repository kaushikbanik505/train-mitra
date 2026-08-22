import client from '../api/client';
import { getQueue, removeFromQueue } from './offlineQueue';

let flushing = false;

// Replays queued submissions in the order they were made. A network-level failure
// (no response at all) means we're still offline, so it stops and waits for the
// next 'online' event rather than retrying in a tight loop. A real server response
// (validation error, quota exceeded, etc.) can't be fixed by retrying, so that item
// is dropped instead of being retried forever.
export async function flushQueue() {
  if (flushing || !navigator.onLine) return;
  flushing = true;
  try {
    const queue = (await getQueue()).sort((a, b) => a.queuedAt - b.queuedAt);
    for (const item of queue) {
      try {
        await client.post(item.endpoint, item.payload);
        await removeFromQueue(item.id);
      } catch (err) {
        if (err.response) {
          await removeFromQueue(item.id);
        } else {
          break;
        }
      }
    }
  } finally {
    flushing = false;
  }
}

export function initOfflineSync() {
  window.addEventListener('online', flushQueue);
  if (navigator.onLine) flushQueue();
}
