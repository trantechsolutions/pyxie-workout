// Chaos M1: server-side allow-list for pet_snapshot.line.
//
// The api/ tree must not import from src/ (build-graph hygiene — the API is
// compiled separately and shouldn't drag the React bundle into Functions).
// This list MUST stay in lockstep with `LINE_REGISTRY` keys in
// src/data/lineRegistry.ts. If a new line is added there, add it here too —
// a unit test in tests/api/pet-snapshot.test.ts verifies parity.

export const KNOWN_LINES: ReadonlySet<string> = new Set([
  'ember',
  'tide',
  'verdant',
  'gale',
  'stone',
  'umbra',
  'aurora',
  'static',
]);
