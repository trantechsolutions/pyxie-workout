import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { loadPersisted, savePersisted, isStorageHealthy } from '../src/lib/storage';

describe('storage adapter', () => {
  beforeEach(() => { localStorage.clear(); });

  it('returns null when nothing is persisted', () => {
    expect(loadPersisted()).toBe(null);
  });

  it('round-trips a typical state object', () => {
    const value = { pet: { name: 'Em' }, history: [{ xpGained: 22 }] };
    savePersisted(value);
    expect(loadPersisted()).toEqual(value);
  });

  it('returns null on corrupted JSON', () => {
    localStorage.setItem('pyxie-state', '{not json');
    expect(loadPersisted()).toBe(null);
  });

  it('writes to the pyxie-state key', () => {
    savePersisted({ x: 1 });
    expect(localStorage.getItem('pyxie-state')).toBe('{"x":1}');
  });
});

describe('window.storage indirection (ADR-003)', () => {
  it('installs a default adapter on import', () => {
    expect(window.storage).toBeDefined();
    expect(typeof window.storage?.get).toBe('function');
    expect(typeof window.storage?.set).toBe('function');
  });

  it('routes writes/reads through the swappable adapter', () => {
    const store = new Map<string, string>();
    const original = window.storage;
    window.storage = {
      get: (k) => store.get(k) ?? null,
      set: (k, v) => { store.set(k, v); },
      remove: (k) => { store.delete(k); },
    };
    try {
      savePersisted({ via: 'shim' });
      expect(store.get('pyxie-state')).toBe('{"via":"shim"}');
      expect(loadPersisted()).toEqual({ via: 'shim' });
    } finally {
      window.storage = original;
    }
  });
});

describe('savePersisted resilience', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('swallows QuotaExceededError from setItem', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    expect(() => savePersisted({ big: 'x'.repeat(10) })).not.toThrow();
  });

  it('a failed save does not break subsequent loads', () => {
    savePersisted({ ok: true });
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    savePersisted({ updated: true });
    spy.mockRestore();
    expect(loadPersisted()).toEqual({ ok: true });
  });

  it('swallows JSON.stringify failure (circular reference)', () => {
    const circ: Record<string, unknown> = { name: 'x' };
    circ.self = circ;
    expect(() => savePersisted(circ)).not.toThrow();
  });
});

describe('isStorageHealthy', () => {
  beforeEach(() => { localStorage.clear(); vi.restoreAllMocks(); });
  afterEach(() => { vi.restoreAllMocks(); });

  it('returns true after a successful round-trip', () => {
    savePersisted({ ok: true });
    expect(isStorageHealthy()).toBe(true);
  });

  it('flips to false when setItem throws on save', () => {
    savePersisted({ ok: true });
    expect(isStorageHealthy()).toBe(true);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError');
    });
    savePersisted({ big: 'x'.repeat(10) });
    expect(isStorageHealthy()).toBe(false);
  });

  it('recovers to true on a subsequent successful save', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    savePersisted({ a: 1 });
    expect(isStorageHealthy()).toBe(false);
    spy.mockRestore();
    savePersisted({ a: 2 });
    expect(isStorageHealthy()).toBe(true);
  });
});
