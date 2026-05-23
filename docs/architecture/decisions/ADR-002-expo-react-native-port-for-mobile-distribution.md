# ADR-002: Expo + React Native Port for Mobile Distribution

**Status:**   Superseded by [ADR-003](./ADR-003-pwa-first-distribution.md)

> **Superseded 2026-05-23.** Owner elected to defer native packaging and ship a PWA first to validate the product before paying any native-toolchain or store-fee cost. Expo port remains the likely future path once PWA traction justifies it. See ADR-003.
**Date:**     2026-05-23
**Author:**   solution-architect agent
**Deciders:** Project owner (solo dev)
**Supersedes:** [ADR-001](./ADR-001-capacitor-shell-for-mobile-distribution.md)

---

## Section 1 — Context

Pyxie is a 1666-line single-file HTML5 calisthenics-pet app (`pyxie.html`) that needs to ship as a real mobile app on iOS and Android. The owner is a solo developer who explicitly wants to avoid installing and maintaining the Xcode and Android Studio toolchains locally, and wants to avoid manual code-signing / provisioning-profile management. ADR-001 originally recommended Capacitor on the basis that wrapping the existing HTML in a WebView would eliminate any rewrite cost. That reasoning was incomplete: Capacitor's cloud-build options (Ionic Appflow, Codemagic, Bitrise) are materially more expensive than Expo's EAS service ($49/mo vs $0–19/mo), do not automate certificate management, and offer no first-party OTA update channel under a paywall. Meanwhile, an audit of Pyxie's actual UI surface — pixel-art SVG sprites generated from char grids, a handful of keyframe animations, a Flexbox layout, native fonts, and standard buttons — shows the port to React Native primitives is a 2–4 day agent-driven task, not the 4–8 week effort ADR-001 implied.

## Section 2 — Decision

We will port `pyxie.html` to a React Native app built with Expo, using EAS Build and EAS Submit for cloud builds and store distribution.

This eliminates the local mobile toolchain entirely (no Xcode, no Android Studio), automates certificate and provisioning-profile management via `eas credentials`, provides a free-tier OTA update channel through `expo-updates`, and lands the project on the larger and faster-moving of the two ecosystems. The one-time visual port — straightforward translation of SVG-string sprites to `react-native-svg`, CSS keyframes to `react-native-reanimated` v3, and Flexbox-on-web to Flexbox-on-RN — is a bounded 2–4 day cost, paid once, in exchange for permanent removal of the distribution friction.

## Section 3 — Consequences

### Positive consequences
- **No local mobile SDKs required.** `eas build` runs in the cloud; the dev machine never needs Xcode or Android Studio installed.
- **Automated credential management.** `eas credentials` generates and stores Apple certificates, provisioning profiles, and Android keystores; no manual `.p12` wrangling per renewal.
- **Free-tier OTA updates** via `expo-updates` — push JS/asset patches without an App Store review cycle.
- **Free-tier cloud builds** (30/mo on the free plan, unlimited on $19/mo Production).
- **Larger ecosystem.** First-class Expo modules for haptics, local notifications, fonts, secure storage, HealthKit / Health Connect, and dozens of others, all version-pinned per SDK release.
- **Better dev loop.** Hot reload via Expo Dev Client; preview on a physical phone in seconds via QR code.
- **Future native features unlocked.** Anything requiring true native UI (e.g. a widget, a watch app, a share extension) is reachable from the same codebase later.

### Negative consequences / trade-offs
- **One-time port cost: 2–4 days** of agent-assisted reimplementation. Includes risk of visual regressions that need iteration.
- **CRT-scanline fidelity is approximate**, not pixel-identical. The web version uses a `repeating-linear-gradient` on a pseudo-element; the RN version will use a tiled overlay or SVG pattern. Expected visual delta is <5% on close inspection.
- **Loss of the "ships as a website too" bonus.** The HTML version remains in the repo but stops evolving; future features land in RN only. (Optional: add `react-native-web` later if a web build matters.)
- **New runtime dependency.** React, React Native, Expo SDK, Reanimated, and `react-native-svg` are now load-bearing. Pyxie was previously dependency-free.
- **Bundle size grows** from ~60 KB (raw HTML) to ~15–25 MB (RN/Hermes/Expo baseline). Acceptable on mobile but no longer trivial.
- **Apple Developer Program ($99/yr)** and **Google Play Console ($25 one-time)** still required. Not avoidable on any path.

## Section 4 — Alternatives considered

### Alternative: Capacitor (ADR-001's original recommendation)
**Why it was considered:** Wraps existing HTML in a WebView with zero rewrite cost; guaranteed pixel-perfect visual fidelity.
**Why it was rejected:** Distribution story is materially worse for a solo dev. No first-party credential automation; cloud-build options (Appflow $49/mo, Codemagic pay-per-minute, Bitrise $36/mo+) are all more expensive and less polished than EAS's free tier. OTA updates are paywalled into Appflow. The "zero rewrite" benefit is real but pays off once; the distribution friction costs recur every release. Given agent-assisted porting collapses the rewrite cost from weeks to days, the trade no longer favors Capacitor.

### Alternative: PWA only (manifest + service worker, no native shell)
**Why it was considered:** Cheapest path. No new toolchains. No app-store fees.
**Why it was rejected:** No app-store presence. iOS Web Push requires manual "Add to Home Screen" before subscription — a discovery cliff for non-technical users. No HealthKit / Health Connect access. Fails the "palm of your hands" distribution goal for users who expect to install from a store.

### Alternative: Flutter
**Why it was considered:** Mature cross-platform framework; Dart and Skia rendering give strong pixel control.
**Why it was rejected:** Full rewrite in a language and ecosystem the owner does not use. Dart adds a learning surface with no offsetting benefit over Expo for a 1666-line project. Expo wins on community size and on having `react-native-svg` ready for the sprite system.

### Alternative: Native Swift + Kotlin
**Why it was considered:** Best possible per-platform UX and performance.
**Why it was rejected:** Two codebases, two toolchains, no shared logic — the opposite of what a solo dev needs. Wildly disproportionate to a calisthenics-pet app.

## Section 5 — Implementation notes

- Bootstrap: `npx create-expo-app pyxie --template blank-typescript` (TS recommended for the state model).
- Required packages: `expo-font`, `expo-haptics`, `expo-notifications`, `expo-router` (or RN Navigation), `react-native-svg`, `react-native-reanimated`, `@react-native-async-storage/async-storage`.
- Port `creatureSVG()` 1:1 — same char-grid → rect approach, just emit `<Rect>` JSX instead of SVG strings.
- Port animations as `useSharedValue` + `withRepeat(withTiming(...))` patterns; one helper for `bob`, one for `twinkle`, one for `squish`.
- Recreate the CRT scanline overlay as a tiled `<Image>` with a 2px-tall pre-rendered PNG, or a single `<Svg>` pattern fill. Accept the small fidelity delta.
- Replace `window.storage` with a thin `AsyncStorage` wrapper exposing the same `get(key) / set(key, value)` async API — the existing call sites do not change.
- Keep the existing state shape (`DEFAULT_STATE`) and decay math verbatim. They are framework-agnostic JS.
- Set up `eas.json` with `development`, `preview`, and `production` profiles before the first build.
- Do not start any cloud-sync / social work in this scope (deferred to a future ADR).

## Section 6 — References

- [ADR-001 — Capacitor Shell (superseded)](./ADR-001-capacitor-shell-for-mobile-distribution.md)
- [Expo SDK docs](https://docs.expo.dev/)
- [EAS Build pricing](https://expo.dev/pricing)
- [react-native-svg](https://github.com/software-mansion/react-native-svg)
- [react-native-reanimated v3](https://docs.swmansion.com/react-native-reanimated/)
