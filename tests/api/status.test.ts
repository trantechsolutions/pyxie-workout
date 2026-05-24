import { describe, it, expect } from 'vitest';
import { deriveConstellationStatus } from '../../api/_lib/status';

// ADR-0007 boundary parity: SQL uses strict `<` against INTERVAL '1 day' /
// '3 days'. The boundary instant lands in the NEXT bucket.
const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = 1_700_000_000_000;

describe('deriveConstellationStatus — boundary cases', () => {
  it('returns sleeping for null', () => {
    expect(deriveConstellationStatus(null, NOW)).toBe('sleeping');
  });

  it('returns sleeping for undefined', () => {
    expect(deriveConstellationStatus(undefined, NOW)).toBe('sleeping');
  });

  it('returns sleeping for unparseable string', () => {
    expect(deriveConstellationStatus('not-a-date', NOW)).toBe('sleeping');
  });

  it('active when completed_at = now - (1 day - 1s)', () => {
    expect(deriveConstellationStatus(NOW - (DAY_MS - 1000), NOW)).toBe('active');
  });

  it('drifting when completed_at = now - exactly 1 day (boundary lands in drifting)', () => {
    expect(deriveConstellationStatus(NOW - DAY_MS, NOW)).toBe('drifting');
  });

  it('drifting when completed_at = now - (1 day + 1s)', () => {
    expect(deriveConstellationStatus(NOW - (DAY_MS + 1000), NOW)).toBe('drifting');
  });

  it('drifting when completed_at = now - (3 days - 1s)', () => {
    expect(deriveConstellationStatus(NOW - (3 * DAY_MS - 1000), NOW)).toBe('drifting');
  });

  it('sleeping when completed_at = now - exactly 3 days (boundary lands in sleeping)', () => {
    expect(deriveConstellationStatus(NOW - 3 * DAY_MS, NOW)).toBe('sleeping');
  });

  it('sleeping when completed_at = now - (3 days + 1s)', () => {
    expect(deriveConstellationStatus(NOW - (3 * DAY_MS + 1000), NOW)).toBe('sleeping');
  });

  it('active for completed_at = now (zero delta)', () => {
    expect(deriveConstellationStatus(NOW, NOW)).toBe('active');
  });

  it('accepts ISO string input identically to numeric ms', () => {
    const iso = new Date(NOW - (DAY_MS - 1000)).toISOString();
    expect(deriveConstellationStatus(iso, NOW)).toBe('active');
  });

  it('treats future timestamps (negative delta) as active', () => {
    // Clock-skew defense: a slightly-future completed_at should not break
    // anything; delta < DAY_MS still passes the active gate.
    expect(deriveConstellationStatus(NOW + 5000, NOW)).toBe('active');
  });
});
