// Behavioral tests for the install-nudge pure helpers in pyxie.html.
// Extracts the sentinel-bounded helper block, evaluates it in a vm sandbox,
// and runs truth-table tests against the three pure functions.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const HTML_PATH = path.join(__dirname, '..', 'pyxie.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');

const SENTINEL = /\/\* ===== INSTALL HELPERS \(pure, testable\) ===== \*\/([\s\S]*?)\/\* ===== END INSTALL HELPERS ===== \*\//;
const match = html.match(SENTINEL);

const failures = [];
function pass(label) { console.log(`PASS  ${label}`); }
function fail(label, detail) { failures.push(`${label}${detail ? ` — ${detail}` : ''}`); console.log(`FAIL  ${label}${detail ? ` (${detail})` : ''}`); }
function assert(cond, label, detail) { cond ? pass(label) : fail(label, detail); }

assert(!!match, 'pyxie.html contains INSTALL HELPERS sentinel block');
if (!match) {
  console.log(`\nFAIL  sentinel block not found — bailing`);
  process.exit(1);
}

const ctx = { module: {}, exports: {} };
vm.createContext(ctx);
vm.runInContext(
  `${match[1]}
   module.exports = { isStandaloneDisplay, isIOSSafariUA, shouldShowFirstRunNudge };`,
  ctx
);
const { isStandaloneDisplay, isIOSSafariUA, shouldShowFirstRunNudge } = ctx.module.exports;

// --- isStandaloneDisplay ---
const mmTrue  = () => ({ matches: true });
const mmFalse = () => ({ matches: false });

assert(isStandaloneDisplay(mmTrue, false)  === true,  'display-mode standalone matchMedia → true');
assert(isStandaloneDisplay(mmFalse, true)  === true,  'navigator.standalone true → true (iOS PWA)');
assert(isStandaloneDisplay(mmFalse, false) === false, 'neither signal → false');
assert(isStandaloneDisplay(null, undefined) === false, 'undefined inputs → false (browser fallback)');

// --- isIOSSafariUA ---
const UA = {
  iPhoneSafari : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  iPadSafari   : 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  iPhoneChrome : 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1',
  iPhoneFirefox: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/126.0 Mobile/15E148 Safari/604.1',
  androidChrome: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36',
  desktopChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  desktopSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
};

assert(isIOSSafariUA(UA.iPhoneSafari)  === true,  'iPhone Safari → true');
assert(isIOSSafariUA(UA.iPadSafari)    === true,  'iPad Safari → true');
assert(isIOSSafariUA(UA.iPhoneChrome)  === false, 'iPhone Chrome (CriOS) → false');
assert(isIOSSafariUA(UA.iPhoneFirefox) === false, 'iPhone Firefox (FxiOS) → false');
assert(isIOSSafariUA(UA.androidChrome) === false, 'Android Chrome → false');
assert(isIOSSafariUA(UA.desktopChrome) === false, 'desktop Chrome → false');
assert(isIOSSafariUA(UA.desktopSafari) === false, 'desktop Safari (no iOS) → false');

// --- shouldShowFirstRunNudge ---
assert(shouldShowFirstRunNudge(3, false, false) === true,  'exactly 3 workouts, not dismissed, not installed → true');
assert(shouldShowFirstRunNudge(2, false, false) === false, '2 workouts → false (too early)');
assert(shouldShowFirstRunNudge(4, false, false) === false, '4 workouts → false (one-time, missed window)');
assert(shouldShowFirstRunNudge(3, true,  false) === false, 'dismissed → false');
assert(shouldShowFirstRunNudge(3, false, true)  === false, 'already installed → false');
assert(shouldShowFirstRunNudge(0, false, false) === false, '0 workouts → false');

console.log(`\n${failures.length === 0 ? 'OK' : 'FAIL'}  ${failures.length === 0 ? 'all install-nudge tests pass' : `${failures.length} failure(s)`}`);
process.exit(failures.length === 0 ? 0 : 1);
