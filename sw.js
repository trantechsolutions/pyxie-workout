// Pyxie service worker — offline cache for the PWA shell.
// Strategy:
//   - Precache app shell + icons on install.
//   - Cache-first for same-origin GETs.
//   - Stale-while-revalidate for Google Fonts (CSS + font files).
//   - Bump CACHE_VERSION to invalidate all caches on the next activate.

const CACHE_VERSION = 'v1';
const SHELL_CACHE   = `pyxie-shell-${CACHE_VERSION}`;
const FONTS_CACHE   = `pyxie-fonts-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  './',
  './pyxie.html',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-maskable.svg',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((k) => k !== SHELL_CACHE && k !== FONTS_CACHE)
        .map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

function isFontRequest(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || networkFetch;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(
      cacheFirst(new Request('./pyxie.html'), SHELL_CACHE)
        .catch(() => caches.match('./pyxie.html'))
    );
    return;
  }

  if (isFontRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, FONTS_CACHE));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, SHELL_CACHE));
  }
});
