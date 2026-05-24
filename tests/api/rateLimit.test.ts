import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, __resetRateLimitForTests } from '../../api/_lib/rateLimit';

describe('checkRateLimit (Chaos H2)', () => {
  beforeEach(() => {
    __resetRateLimitForTests();
  });

  it('allows up to N requests within the window', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 10; i += 1) {
      const r = checkRateLimit('user_a', 10, 600_000, t0 + i);
      expect(r.allowed).toBe(true);
    }
  });

  it('rejects the 11th with a positive retryAfterMs', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 10; i += 1) {
      checkRateLimit('user_a', 10, 600_000, t0 + i);
    }
    const r = checkRateLimit('user_a', 10, 600_000, t0 + 100);
    expect(r.allowed).toBe(false);
    expect(r.retryAfterMs).toBeGreaterThan(0);
    // Oldest at t0; window 600_000; now t0+100 -> retry = 600_000 - 100.
    expect(r.retryAfterMs).toBe(600_000 - 100);
  });

  it('the first slot frees up after the window elapses', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 10; i += 1) {
      checkRateLimit('user_a', 10, 600_000, t0 + i);
    }
    // 11th still blocked at t0 + 599_999.
    expect(checkRateLimit('user_a', 10, 600_000, t0 + 599_999).allowed).toBe(false);
    // After full window, the t0 entry expires and we should be admitted.
    const after = checkRateLimit('user_a', 10, 600_000, t0 + 600_001);
    expect(after.allowed).toBe(true);
  });

  it('keys are isolated', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 10; i += 1) {
      checkRateLimit('user_a', 10, 600_000, t0 + i);
    }
    // user_b still gets the full quota.
    const r = checkRateLimit('user_b', 10, 600_000, t0);
    expect(r.allowed).toBe(true);
  });
});
