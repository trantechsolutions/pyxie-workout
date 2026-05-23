# ADR-001: Capacitor Shell for Mobile Distribution

**Status:**   Superseded by [ADR-002](./ADR-002-expo-react-native-port-for-mobile-distribution.md)
**Date:**     2026-05-23
**Author:**   solution-architect agent
**Deciders:** Project owner (solo dev)

> **Superseded 2026-05-23.** Original analysis underweighted (a) the cost of Capacitor's distribution story for a solo dev who wants to avoid Xcode/Android Studio and manual cert management, and (b) overstated the rewrite cost of porting Pyxie's UI to React Native given agent-assisted development. See ADR-002 for the revised decision.

---

## Section 1 — Context

Pyxie currently exists as a single 1666-line `pyxie.html` file: a self-contained Tamagotchi-style virtual-pet calisthenics app built with vanilla HTML, CSS, and JS. The retro pixel-art aesthetic — bespoke SVG sprites rendered from 16×16 char grids, `Pixelify Sans` typography, CRT scanlines, animated starfield, and tactile button squish — is core to the product's identity, not decoration. State is persisted through an already-abstracted `window.storage.get/set` async wrapper. The app is mobile-first (480px column, `dvh` units, safe-area aware). The owner wants to distribute it as a real mobile app installable on iOS and Android so others can use it to get in shape, without rebuilding the visual layer.

## Section 2 — Decision

We will package `pyxie.html` as a native iOS and Android app using **Capacitor** (by Ionic), with a PWA manifest layered on top for installable web distribution.

Capacitor wraps the existing HTML/JS in a platform `WebView` (`WKWebView` on iOS, `WebView` on Android), so the retro UI ships pixel-for-pixel without rewriting it in a native framework. It provides the only native capabilities the product actually needs — `@capacitor/preferences` (drop-in replacement for the existing `window.storage` wrapper), `@capacitor/local-notifications` (pet-hunger / rest-day nudges), `@capacitor/haptics` (button feedback), and optional `@capacitor-community/health` (HealthKit / Health Connect for step-based XP) — through a uniform JS bridge. The asset bundle remains a single HTML file, so the build pipeline stays trivial.

## Section 3 — Consequences

### Positive consequences
- **Zero visual rewrite.** The CRT scanlines, pixel sprites, and bob/squish animations render identically to today's web build.
- **App Store + Play Store presence** with a single codebase.
- **Native local notifications** unlock the core retention loop ("Your Emberling is hungry — feed it with a workout").
- **Drop-in storage swap.** Replacing `window.storage` with `@capacitor/preferences` is one file, one wrapper.
- **PWA fallback** means users who can't or won't install from a store get the same experience from a URL.
- **Future-proof.** Cloud sync (Supabase) can be added later as a fetch-only network layer without touching the shell.

### Negative consequences / trade-offs
- **Two new platform toolchains** to maintain: Xcode (macOS required for iOS builds) and Android Studio. Solo dev must own both.
- **Apple Developer Program ($99/yr)** and **Google Play Console ($25 one-time)** fees required for store distribution.
- **App review latency** (1–3 days Apple, hours Google) on every release — slower than pushing a web update.
- **WebView quirks.** iOS `WKWebView` has subtle differences vs Mobile Safari (e.g. autoplay audio policies, `localStorage` eviction); a small test pass per release is required.
- **Bundle size baseline ~6–10 MB** before any code, vs <60 KB for the bare HTML. Acceptable on mobile but not free.
- **No true background execution.** Decay still computes on app open (current behavior); push-driven decay would need a backend.

## Section 4 — Alternatives considered

### Alternative: PWA only (no native shell)
**Why it was considered:** Cheapest path — add a `manifest.json` and service worker, ship as installable web app. Zero new toolchains.
**Why it was rejected:** No app-store presence (a stated goal — "palm of your hands" for "others"). iOS Web Push only works from 16.4+ and requires the user to manually "Add to Home Screen" before subscribing — a discovery cliff for non-technical users. No HealthKit / Health Connect access closes off step-count integration permanently.

### Alternative: React Native or Flutter rewrite
**Why it was considered:** "Proper" native apps with full platform API access and arguably better performance.
**Why it was rejected:** Both require rebuilding the pixel-art SVG renderer, the CRT-effect compositing, and every animation from scratch — 4–8 weeks of work whose deliverable is, at best, visually identical to what already exists. High risk of losing aesthetic fidelity (the product's main asset). Unjustified for a solo dev with no performance complaint against the current WebView-grade rendering.

### Alternative: Expo / Expo Go (React Native + managed tooling)
**Why it was considered:** Expo is the most popular path for solo devs shipping cross-platform mobile, with strong tooling (EAS Build, OTA updates, Expo Go dev sandbox) and a large plugin ecosystem.
**Why it was rejected:** Expo renders through React Native to native `UIView` / `android.view.View` primitives — there is no DOM, no CSS cascade, no runtime SVG-string injection, and no `@keyframes`. Every visual element of Pyxie — the radial-gradient starfield, `repeating-linear-gradient` CRT scanlines, `text-shadow` glow, `image-rendering: pixelated`, the `bob` / `squish` / `twinkle` keyframe animations, and the `creatureSVG()` function that builds SVG markup from 16×16 char grids at runtime — would need reimplementation in `react-native-svg`, `react-native-reanimated`, and `expo-linear-gradient`. That is the same rewrite cost as the bare React Native option above, just with better build tooling on top. Separately, Expo Go itself is a dev-time sandbox, not a distribution channel — end users still receive an EAS-built binary through the App Store and Play Store, so Expo Go does not shorten the distribution path. Capacitor preserves the existing rendering engine (the WebView) the app was built against; Expo would replace it.

### Alternative: TWA (Trusted Web Activity) on Android + PWA on iOS
**Why it was considered:** Lighter than Capacitor on Android; lets the same hosted PWA serve both.
**Why it was rejected:** Splits the codebase into two distribution stories with different capability sets. Capacitor unifies both targets with one bridge API and one build command, at marginal extra cost.

## Section 5 — Implementation notes

- Initialize Capacitor with `npm init @capacitor/app`, app id `com.pyxie.app`, web dir = project root.
- Move `pyxie.html` → `www/index.html` (or configure `webDir` to point at it in place).
- Install plugins: `@capacitor/preferences`, `@capacitor/local-notifications`, `@capacitor/haptics`, `@capacitor/status-bar`, `@capacitor/splash-screen`.
- Replace the body of `window.storage` with calls to `Preferences.get` / `Preferences.set` — the existing async API surface already matches.
- Add a `manifest.json` and minimal service worker so the same `index.html` doubles as an installable PWA.
- Defer cloud sync (Supabase) and social features to a future ADR — do not let MVP scope creep.

## Section 6 — References

- [Capacitor docs](https://capacitorjs.com/docs)
- [@capacitor/preferences](https://capacitorjs.com/docs/apis/preferences)
- [@capacitor/local-notifications](https://capacitorjs.com/docs/apis/local-notifications)
