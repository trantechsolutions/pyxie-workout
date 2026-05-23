const KEY = 'pyxie-state';
const PROBE_KEY = '__pyxie_probe__';

export interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

const localStorageAdapter: StorageAdapter = {
  get: (k) => localStorage.getItem(k),
  set: (k, v) => localStorage.setItem(k, v),
  remove: (k) => localStorage.removeItem(k),
};

// ADR-003: keep an indirection so a native shell (Capacitor/Expo) can swap
// the backing store without touching call sites.
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = localStorageAdapter;
}

function adapter(): StorageAdapter {
  return (typeof window !== 'undefined' && window.storage) || localStorageAdapter;
}

let healthy = true;

function probe(): boolean {
  try {
    adapter().set(PROBE_KEY, '1');
    adapter().remove(PROBE_KEY);
    return true;
  } catch {
    return false;
  }
}

if (typeof window !== 'undefined') {
  healthy = probe();
}

export function isStorageHealthy(): boolean {
  return healthy;
}

export function loadPersisted(): unknown | null {
  try {
    const raw = adapter().get(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function savePersisted(value: unknown): void {
  try {
    adapter().set(KEY, JSON.stringify(value));
    healthy = true;
  } catch {
    healthy = false;
    /* quota or private-mode — surfaced via isStorageHealthy() */
  }
}
