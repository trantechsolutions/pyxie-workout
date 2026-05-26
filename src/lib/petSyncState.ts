// ADR-009 M3: shared sync cursor for pet write-through. Both
// `usePetHydration` (M2) and `usePetFlusher` (M3) write here so the very
// first PUT after sign-in is NOT a redundant re-PUT of what hydration just
// GET'd.
//
// Module-scope state intentionally — these are internal sync details, not
// store surface. Mirrors how `useSyncFlusher` keeps its in-flight cursor
// outside the zustand store.

let lastSignature: string | null = null;
let lastVersion: number = 0;

export function computePetSignature(pet: unknown): string {
  if (pet === null || pet === undefined) return 'null';
  return JSON.stringify(pet);
}

export function getLastSignature(): string | null {
  return lastSignature;
}

export function setLastSignature(sig: string | null): void {
  lastSignature = sig;
}

export function getLastVersion(): number {
  return lastVersion;
}

export function setLastVersion(v: number): void {
  lastVersion = v;
}

/** Reset to initial state — used on sign-out and by tests. */
export function resetPetSyncState(): void {
  lastSignature = null;
  lastVersion = 0;
}
