# ADR-003: PWA-First Distribution

**Status:**   Accepted
**Date:**     2026-05-23
**Author:**   solution-architect agent
**Deciders:** Project owner (solo dev)
**Supersedes:** [ADR-002](./ADR-002-expo-react-native-port-for-mobile-distribution.md)

---

## Section 1 — Context

Pyxie exists today as a single 1666-line `pyxie.html` — a self-contained calisthenics-pet app that already runs in any modern mobile browser. The owner is a solo dev launching this as a new venture and wants to validate the product (will real people use it daily? does the pet-as-workout-motivator loop work?) before investing in mobile-native packaging, store-listing artwork, developer-program fees, or a port to another framework. Both prior ADRs (Capacitor in ADR-001, Expo in ADR-002) optimized for a native distribution outcome that may be premature at this stage. The `window.storage` wrapper, the `dvh`-aware layout, the mobile-first 480px column, and the safe-area-respecting padding are already in place — the app is much closer to "installable web app" than to "needs a native shell."

## Section 2 — Decision

We will ship Pyxie as a Progressive Web App (PWA) — a `manifest.json`, an installable app icon set, and a service worker for offline use — hosted at a public URL.

This is the cheapest possible distribution path: $0 in store fees, no native toolchains, no certificate management, no app-review latency. Users install it via "Add to Home Screen" on iOS and Android, where it launches in standalone display mode and looks indistinguishable from a native app on first glance. The existing HTML is preserved unmodified except for adding a `<link rel="manifest">` tag and registering the service worker. When the product earns traction, the same hardened web build can be wrapped with Capacitor or ported to Expo (ADR-002 remains the planned future path) without throwing work away.

## Section 3 — Consequences

### Positive consequences
- **Zero fixed costs.** No $99/yr Apple fee, no $25 Google fee, no $19/mo EAS plan. Hosting is the only recurring cost (and is near-free on Netlify / Cloudflare Pages / GitHub Pages).
- **Ship today.** The work is a manifest, an icon set, a small service worker, and a deploy — hours, not days.
- **No code rewrite.** `pyxie.html` ships byte-for-byte; retro aesthetic is guaranteed pixel-perfect.
- **Instant updates.** Push a new commit, every installed user gets the latest version on next launch — no store review cycle.
- **Fast iteration during product validation.** The cheapest format to learn from.
- **Forward-compatible.** Capacitor can wrap this exact build later (ADR-001 path); Expo port (ADR-002 path) remains viable as a separate decision.

### Negative consequences / trade-offs
- **No app-store presence.** Discovery happens via shared URLs, not store search. Acceptable while validating; a real growth ceiling at scale.
- **Install friction on iOS.** Users must open in Safari (not Chrome/in-app browsers), tap Share → "Add to Home Screen." A meaningful drop-off step.
- **iOS Web Push limited.** Works only on iOS 16.4+ *and* only after the user installs the PWA *and* explicitly grants notification permission. Rest-day / hunger nudges land softly on iOS.
- **No HealthKit / Health Connect.** Step-count-as-XP integration is off the table until the native wrap.
- **No haptics on iOS PWAs.** Android Chrome supports the Vibration API; iOS Safari does not. Button "squish" remains visual only on iPhones.
- **iOS background storage eviction risk.** If a user doesn't open the PWA for ~7 weeks, iOS may evict `localStorage` / IndexedDB. Mitigate with a "backup code" or future cloud sync.
- **Discoverability of the install action** is poor by default. A first-run nudge ("Add to Home Screen to keep your pet alive") is part of the work.

## Section 4 — Alternatives considered

### Alternative: Expo port now (ADR-002)
**Why it was considered:** Best long-term mobile distribution story; automated signing; OTA updates.
**Why it was rejected for *now*:** Premature optimization for a product that hasn't yet proven its retention loop. 2–4 days of port work plus $99/yr Apple plus store-submission overhead is real cost paid against unvalidated demand. PWA-first defers that bet without closing the door on it.

### Alternative: Capacitor wrap now (ADR-001)
**Why it was considered:** Zero rewrite; native APIs available.
**Why it was rejected for *now*:** Still requires Xcode/Android Studio or a paid cloud-build service, plus store fees and review cycles — all unjustified before validating the product. PWA achieves the "users install it on their phone" outcome without that overhead.

### Alternative: Web app only, no PWA install
**Why it was considered:** Even simpler — just a URL.
**Why it was rejected:** A non-installed browser tab is forgettable. The whole product premise ("a pet living in your pocket") depends on a launcher icon and standalone-mode launch. PWA is the minimum format that delivers that.

## Section 5 — Implementation notes

- Host on **Cloudflare Pages** or **Netlify** (free tier covers this trivially; both auto-issue HTTPS, which is a PWA hard requirement).
- Add `manifest.json` with `name`, `short_name: "Pyxie"`, `start_url: "/"`, `display: "standalone"`, `background_color: "#0a0418"`, `theme_color: "#0a0418"`, and a full icon set (192, 256, 384, 512, plus maskable variants and Apple touch icons).
- Generate the icon set from a single 1024×1024 pixel-art master (Pyxie title + Emberling sprite is a good candidate).
- Service worker: cache-first for `pyxie.html`, the Google Fonts assets, and the manifest. Use a versioned cache key so updates evict cleanly. Keep it under 50 lines — no Workbox needed for a one-page app.
- Add a one-time "Add to Home Screen" nudge that fires on the third successful workout completion (not on first visit — let users decide they like it first).
- Keep `window.storage` as it is; no need to migrate to IndexedDB unless localStorage capacity becomes a real constraint.
- Set viewport `theme-color` meta to `#0a0418` so the status bar tints correctly when launched standalone.
- Verify in Lighthouse → Application → Manifest and Service Worker tabs before deploying.

## Section 6 — References

- [ADR-001 — Capacitor (superseded)](./ADR-001-capacitor-shell-for-mobile-distribution.md)
- [ADR-002 — Expo port (superseded, future path)](./ADR-002-expo-react-native-port-for-mobile-distribution.md)
- [web.dev PWA checklist](https://web.dev/pwa-checklist/)
- [Apple — Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)
