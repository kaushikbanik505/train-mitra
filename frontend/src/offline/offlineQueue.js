const DB_NAME = 'trainmitra-offline';
const DB_VERSION = 1;
const STORE = 'pending';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function promisify(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

const listeners = new Set();

async function notifyListeners() {
  const queue = await getQueue();
  listeners.forEach((fn) => fn(queue));
}

// Subscribes to queue changes (item added or removed); returns an unsubscribe fn.
export function onQueueChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export async function enqueue({ endpoint, payload, label }) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  const result = await promisify(tx.objectStore(STORE).add({ endpoint, payload, label, queuedAt: Date.now() }));
  await notifyListeners();
  return result;
}

export async function getQueue() {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readonly');
  return promisify(tx.objectStore(STORE).getAll());
}

export async function removeFromQueue(id) {
  const db = await openDB();
  const tx = db.transaction(STORE, 'readwrite');
  await promisify(tx.objectStore(STORE).delete(id));
  await notifyListeners();
}
