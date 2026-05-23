// PWA installability verification for Pyxie.
// Asserts manifest schema, icon file existence, and required <head> tags in pyxie.html.
// Exits non-zero on any failure.

const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const failures = [];
const checks = [];

function ok(label) { checks.push(`PASS  ${label}`); }
function fail(label, detail) {
  failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
  checks.push(`FAIL  ${label}${detail ? ` (${detail})` : ''}`);
}
function assert(cond, label, detail) { cond ? ok(label) : fail(label, detail); }

// --- manifest.json ---
const manifestPath = path.join(root, 'manifest.json');
assert(fs.existsSync(manifestPath), 'manifest.json exists');

let manifest;
try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  ok('manifest.json parses as JSON');
} catch (e) {
  fail('manifest.json parses as JSON', e.message);
  manifest = {};
}

const required = ['name', 'short_name', 'start_url', 'display', 'background_color', 'theme_color', 'icons'];
for (const key of required) {
  assert(manifest[key] !== undefined && manifest[key] !== '', `manifest.${key} is set`);
}

assert(['standalone', 'fullscreen', 'minimal-ui'].includes(manifest.display),
  'manifest.display is an installable value', `got "${manifest.display}"`);

assert(Array.isArray(manifest.icons) && manifest.icons.length >= 2,
  'manifest.icons has >= 2 entries', `got ${manifest.icons?.length ?? 0}`);

const purposes = new Set((manifest.icons || []).flatMap(i => (i.purpose || 'any').split(/\s+/)));
assert(purposes.has('any'), 'manifest.icons covers purpose "any"');
assert(purposes.has('maskable'), 'manifest.icons covers purpose "maskable"');

for (const icon of manifest.icons || []) {
  const p = path.join(root, icon.src);
  assert(fs.existsSync(p), `icon file exists: ${icon.src}`);
  if (fs.existsSync(p)) {
    const size = fs.statSync(p).size;
    assert(size > 100, `icon file non-trivial: ${icon.src}`, `size=${size}`);
  }
}

// --- pyxie.html head tags ---
const htmlPath = path.join(root, 'pyxie.html');
assert(fs.existsSync(htmlPath), 'pyxie.html exists');
const html = fs.readFileSync(htmlPath, 'utf8');
const head = html.slice(0, html.indexOf('</head>'));

const requiredTags = [
  { label: 'manifest link',                regex: /<link\s+rel=["']manifest["']\s+href=["']manifest\.json["']/ },
  { label: 'theme-color meta',             regex: /<meta\s+name=["']theme-color["']\s+content=["']#0a0418["']/ },
  { label: 'apple-mobile-web-app-capable', regex: /<meta\s+name=["']apple-mobile-web-app-capable["']\s+content=["']yes["']/ },
  { label: 'apple-mobile-web-app-title',   regex: /<meta\s+name=["']apple-mobile-web-app-title["']/ },
  { label: 'apple-touch-icon link',        regex: /<link\s+rel=["']apple-touch-icon["']/ },
  { label: 'viewport meta',                regex: /<meta\s+name=["']viewport["']/ },
];
for (const { label, regex } of requiredTags) {
  assert(regex.test(head), `pyxie.html head contains ${label}`);
}

// --- Service worker ---
const swPath = path.join(root, 'sw.js');
assert(fs.existsSync(swPath), 'sw.js exists');
if (fs.existsSync(swPath)) {
  const sw = fs.readFileSync(swPath, 'utf8');
  assert(/CACHE_VERSION\s*=\s*['"][^'"]+['"]/.test(sw), 'sw.js declares CACHE_VERSION');
  assert(/addEventListener\(['"]install['"]/.test(sw),  'sw.js has install listener');
  assert(/addEventListener\(['"]activate['"]/.test(sw), 'sw.js has activate listener');
  assert(/addEventListener\(['"]fetch['"]/.test(sw),    'sw.js has fetch listener');
  assert(/pyxie\.html/.test(sw),                        'sw.js precaches pyxie.html');
}

assert(/navigator\.serviceWorker\.register\(['"]sw\.js['"]\)/.test(html),
  'pyxie.html registers sw.js');

// --- Install nudge ---
assert(/===== INSTALL HELPERS \(pure, testable\) =====/.test(html),
  'pyxie.html contains testable install-helpers sentinel');
assert(/addEventListener\(['"]beforeinstallprompt['"]/.test(html),
  'pyxie.html listens for beforeinstallprompt');
assert(/addEventListener\(['"]appinstalled['"]/.test(html),
  'pyxie.html listens for appinstalled');
assert(/@media \(display-mode: standalone\)/.test(html),
  'pyxie.html hides install nudge when launched standalone');
assert(/installNudgeDismissed/.test(html),
  'pyxie.html persists install-nudge dismissal');
assert(/shouldShowFirstRunNudge\(/.test(html),
  'pyxie.html invokes shouldShowFirstRunNudge gate');

// --- vercel.json hosting config ---
const vercelPath = path.join(root, 'vercel.json');
assert(fs.existsSync(vercelPath), 'vercel.json exists');
if (fs.existsSync(vercelPath)) {
  let vc;
  try {
    vc = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
    ok('vercel.json parses as JSON');
  } catch (e) {
    fail('vercel.json parses as JSON', e.message);
    vc = {};
  }

  const rewrites = vc.rewrites || [];
  assert(rewrites.some((r) => r.source === '/' && /pyxie\.html$/.test(r.destination || '')),
    'vercel.json rewrites / → /pyxie.html');

  const headers = vc.headers || [];
  const findHeader = (src, key) => {
    const block = headers.find((h) => h.source === src);
    if (!block) return null;
    return (block.headers || []).find((h) => h.key.toLowerCase() === key.toLowerCase());
  };

  const swCache = findHeader('/sw.js', 'Cache-Control');
  assert(swCache && /no-(cache|store)/i.test(swCache.value),
    'vercel.json sets no-cache on /sw.js', swCache ? swCache.value : 'missing');

  const htmlCache = findHeader('/pyxie.html', 'Cache-Control');
  assert(htmlCache && /no-(cache|store)/i.test(htmlCache.value),
    'vercel.json sets no-cache on /pyxie.html', htmlCache ? htmlCache.value : 'missing');

  const manifestCt = findHeader('/manifest.json', 'Content-Type');
  assert(manifestCt && /manifest\+json/i.test(manifestCt.value),
    'vercel.json sets application/manifest+json on /manifest.json');

  const iconsCache = findHeader('/icons/(.*)', 'Cache-Control');
  assert(iconsCache && /immutable/i.test(iconsCache.value),
    'vercel.json sets immutable cache on /icons/*');
}

const ignorePath = path.join(root, '.vercelignore');
assert(fs.existsSync(ignorePath), '.vercelignore exists');
if (fs.existsSync(ignorePath)) {
  const ig = fs.readFileSync(ignorePath, 'utf8');
  for (const dir of ['scripts', 'docs', 'memory', 'node_modules']) {
    assert(new RegExp(`(^|\\n)${dir}(\\n|$)`).test(ig), `.vercelignore excludes ${dir}`);
  }
}

// --- Report ---
console.log(checks.join('\n'));
console.log(`\n${failures.length === 0 ? 'OK' : 'FAIL'}  ${checks.length - failures.length}/${checks.length} checks passed`);
process.exit(failures.length === 0 ? 0 : 1);
