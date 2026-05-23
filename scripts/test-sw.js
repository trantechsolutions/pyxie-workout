// Behavioral tests for sw.js — runs the SW source in a vm sandbox with
// mocked self/caches/fetch and asserts cache lifecycle behavior.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SW_PATH = path.join(__dirname, '..', 'sw.js');
const SW_SOURCE = fs.readFileSync(SW_PATH, 'utf8');

const failures = [];
function pass(label) { console.log(`PASS  ${label}`); }
function fail(label, detail) { failures.push(`${label}${detail ? ` — ${detail}` : ''}`); console.log(`FAIL  ${label}${detail ? ` (${detail})` : ''}`); }
function assert(cond, label, detail) { cond ? pass(label) : fail(label, detail); }

// ---- Fakes ----
function makeFakeCache() {
  const store = new Map();
  return {
    store,
    async addAll(urls) { for (const u of urls) store.set(String(u), { url: String(u), ok: true }); },
    async match(req) { return store.get(typeof req === 'string' ? req : req.url) || undefined; },
    async put(req, res) { store.set(typeof req === 'string' ? req : req.url, res); },
  };
}

function makeFakeCaches() {
  const caches = new Map();
  return {
    caches,
    async open(name) {
      if (!caches.has(name)) caches.set(name, makeFakeCache());
      return caches.get(name);
    },
    async keys() { return [...caches.keys()]; },
    async delete(name) { return caches.delete(name); },
    async match(req) {
      for (const c of caches.values()) {
        const hit = await c.match(req);
        if (hit) return hit;
      }
      return undefined;
    },
  };
}

function makeSandbox() {
  const handlers = {};
  const fakeCaches = makeFakeCaches();
  const fakeSelf = {
    addEventListener(type, fn) { handlers[type] = fn; },
    skipWaiting: async () => { fakeSelf._skipWaitingCalled = true; },
    clients: { claim: async () => { fakeSelf._claimCalled = true; } },
    location: { origin: 'https://pyxie.test' },
  };
  const ctx = {
    self: fakeSelf,
    caches: fakeCaches,
    fetch: async () => ({ ok: true, clone() { return this; } }),
    Request: class { constructor(url) { this.url = url; this.method = 'GET'; } },
    URL,
    console,
  };
  vm.createContext(ctx);
  vm.runInContext(SW_SOURCE, ctx);
  return { handlers, fakeSelf, fakeCaches, ctx };
}

function fakeEvent() {
  const promises = [];
  let respondWithCalled = null;
  return {
    waitUntil(p) { promises.push(p); },
    respondWith(p) { respondWithCalled = p; },
    _await: () => Promise.all(promises),
    _response: () => respondWithCalled,
  };
}

// ---- Tests ----
(async () => {
  // 1. SW registers expected event handlers.
  const { handlers, fakeSelf, fakeCaches } = makeSandbox();
  assert(typeof handlers.install  === 'function', 'sw.js registers install handler');
  assert(typeof handlers.activate === 'function', 'sw.js registers activate handler');
  assert(typeof handlers.fetch    === 'function', 'sw.js registers fetch handler');

  // 2. Install precaches the shell + icons.
  const installEvt = fakeEvent();
  handlers.install(installEvt);
  await installEvt._await();
  const cacheKeys = [...fakeCaches.caches.keys()];
  const shellCacheName = cacheKeys.find((k) => k.startsWith('pyxie-shell-'));
  assert(!!shellCacheName, 'install creates a versioned pyxie-shell cache');
  if (shellCacheName) {
    const cache = fakeCaches.caches.get(shellCacheName);
    const stored = [...cache.store.keys()];
    const required = ['./', './pyxie.html', './manifest.json', './icons/icon.svg', './icons/icon-maskable.svg', './icons/apple-touch-icon.png'];
    for (const u of required) {
      assert(stored.includes(u), `install precaches ${u}`);
    }
  }
  assert(fakeSelf._skipWaitingCalled === true, 'install calls skipWaiting()');

  // 3. Activate evicts old caches but keeps current ones.
  fakeCaches.caches.set('pyxie-shell-v0', makeFakeCache());          // legacy
  fakeCaches.caches.set('pyxie-fonts-v0', makeFakeCache());          // legacy
  fakeCaches.caches.set('unrelated-cache', makeFakeCache());         // foreign
  const activateEvt = fakeEvent();
  handlers.activate(activateEvt);
  await activateEvt._await();
  const remaining = [...fakeCaches.caches.keys()];
  assert(!remaining.includes('pyxie-shell-v0'),  'activate evicts pyxie-shell-v0');
  assert(!remaining.includes('pyxie-fonts-v0'),  'activate evicts pyxie-fonts-v0');
  assert(!remaining.includes('unrelated-cache'), 'activate evicts unrelated caches');
  assert(remaining.includes(shellCacheName),     'activate keeps current shell cache');
  assert(fakeSelf._claimCalled === true,         'activate calls clients.claim()');

  // 4. Fetch handler for navigation returns the cached pyxie.html.
  const navEvt = fakeEvent();
  navEvt.request = { method: 'GET', mode: 'navigate', url: 'https://pyxie.test/whatever' };
  handlers.fetch(navEvt);
  assert(navEvt._response() !== null, 'navigation fetch is handled (respondWith called)');
  if (navEvt._response()) {
    const res = await navEvt._response();
    assert(res && res.url === './pyxie.html', 'navigation fetch resolves to ./pyxie.html');
  }

  // 5. Cross-origin (non-fonts) fetches are passed through (no respondWith).
  const crossEvt = fakeEvent();
  crossEvt.request = { method: 'GET', mode: 'cors', url: 'https://example.com/x' };
  handlers.fetch(crossEvt);
  assert(crossEvt._response() === null, 'foreign cross-origin GETs are passed through');

  // 6. Google Fonts requests are handled (stale-while-revalidate).
  const fontEvt = fakeEvent();
  fontEvt.request = { method: 'GET', mode: 'cors', url: 'https://fonts.gstatic.com/abc.woff2' };
  handlers.fetch(fontEvt);
  assert(fontEvt._response() !== null, 'fonts.gstatic.com requests are intercepted');

  // 7. Non-GET requests are not intercepted.
  const postEvt = fakeEvent();
  postEvt.request = { method: 'POST', mode: 'cors', url: 'https://pyxie.test/api' };
  handlers.fetch(postEvt);
  assert(postEvt._response() === null, 'non-GET requests are not intercepted');

  console.log(`\n${failures.length === 0 ? 'OK' : 'FAIL'}  ${failures.length === 0 ? 'all SW tests pass' : `${failures.length} failure(s)`}`);
  process.exit(failures.length === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
