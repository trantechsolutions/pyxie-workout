# ADR 0001: Adopt zustand `persist` Middleware

- **Status:** Proposed
- **Date:** 2026-05-23
- **Authors:** Jonathan V Tran

## Context
Persistence today is a hand-rolled module-load subscription in `src/store/usePyxie.ts`: a `usePyxie.subscribe(...)` callback diffs a fixed key set (`pet`, `settings`, `history`, `installNudgeDismissed`, `ui.tab`) via `JSON.stringify` and calls `state.persist()`, which writes through `savePersisted()` in `src/lib/storage.ts` to the `pyxie-state` localStorage key. `usePersistenceLifecycle` also flushes on `visibilitychange` / `beforeunload`. Rehydration is synchronous at module load in `createPersistenceSlice`. This works, but: (1) it duplicates logic zustand already ships, (2) the subscription is a module side-effect that complicates SSR / test isolation, and (3) merge/version semantics on schema changes are ad-hoc.

## Decision drivers
- **DX:** declarative `partialize` / `merge` / `version` beats a global subscriber.
- **Bundle size:** middleware is ~1KB gzipped on top of zustand — negligible.
- **Migration risk:** storage key + shape change touches every existing user's saved state.
- **Test impact:** 151 tests; `tests/storage.test.ts`, `tests/store.test.ts`, `tests/app.test.tsx`, `tests/hooks.test.tsx` all depend on current shape, key, and synchronous-rehydrate timing.

## Options considered
- **A. Keep current hand-rolled subscribe.** Zero migration cost, zero new dependency surface. Continues to drift from idiomatic zustand; we keep maintaining diff + lifecycle plumbing ourselves.
- **B. Migrate to `zustand/middleware/persist`.** Idiomatic, gives us `version` + `migrate` for free, removes the module-load subscriber. Costs a one-time on-disk shape change (`{ state, version }`) and a forced rewrite of persistence tests.
- **C. Hybrid — `persist` middleware with a custom `StorageAdapter`-backed `createJSONStorage`.** Preserves the `window.storage` indirection from ADR-003 (Capacitor/Expo swap) while still getting middleware ergonomics. Same migration cost as B plus a thin adapter shim.

## Recommendation
**Option C.** It captures B's DX win without throwing away the native-shell escape hatch already documented in `storage.ts`. The adapter shim is ~10 lines.

## Migration plan
1. In `src/lib/storage.ts`, export a `createPyxieStorage()` that wraps `adapter()` and conforms to zustand's `StateStorage` (`getItem` / `setItem` / `removeItem`). Keep `KEY = 'pyxie-state'` exported as `LEGACY_KEY`; new key is `pyxie-state-v1`.
2. Add `loadLegacyPersisted()` that reads `LEGACY_KEY` and returns the parsed blob, then `removeLegacy()` to delete it. `savePersisted()` / `loadPersisted()` stay (still called by tests) but are marked deprecated.
3. In `usePyxie.ts`, wrap the store with `persist(creator, { name: 'pyxie-state-v1', version: 1, storage: createJSONStorage(createPyxieStorage), partialize: (s) => ({ pet: s.pet, settings: s.settings, history: s.history, installNudgeDismissed: s.installNudgeDismissed, ui: { tab: s.ui.tab } }), merge: (persisted, current) => deepMerge(current, persisted) })`.
4. Add `onRehydrateStorage`: on first run, if `getItem(LEGACY_KEY)` exists and new key does not, hydrate from legacy, persist under new key, then `removeLegacy()`.
5. Delete the module-load `subscribe` block and `createPersistenceSlice.persist()` (or leave as a no-op shim until `usePersistenceLifecycle` is updated to call `usePyxie.persist.rehydrate()` / nothing on flush).
6. Update `tests/storage.test.ts` and `tests/store.test.ts` for the wrapped `{ state, version }` shape; update `tests/hooks.test.tsx` to assert middleware-driven writes instead of `persist()` calls.

## Risks & rollback
- **Highest risk:** the one-shot legacy→new migration runs in the browser on real user data — if `merge` is wrong, pets/history are silently clobbered. Mitigation: write the new key *before* deleting the legacy key, gate the delete behind a successful round-trip read, and ship a Sentry-style console warning the first time migration fires. Rollback = revert the commit; legacy key is still on disk for any user who didn't yet hit step 4.
- Secondary: middleware rehydrate is async in some environments — `usePersistenceLifecycle` and first-paint selectors must tolerate a brief pre-hydrate state.

## Open questions / out of scope
- Should `history` move to IndexedDB once it grows past ~1MB? (Out of scope here; addressable later via a different `StateStorage` impl.)
- Do we want per-slice `partialize` colocated in each slice file? (Defer until slices stabilize.)
