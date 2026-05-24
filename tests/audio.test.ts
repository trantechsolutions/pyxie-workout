import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { beep, requestNotificationPerm } from '../src/lib/audio';

interface FakeOsc {
  type: string;
  frequency: { value: number };
  connect: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
}
interface FakeGain {
  gain: {
    setValueAtTime: ReturnType<typeof vi.fn>;
    exponentialRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
}
interface FakeCtx {
  currentTime: number;
  state: string;
  destination: object;
  resume: ReturnType<typeof vi.fn>;
  createOscillator: ReturnType<typeof vi.fn>;
  createGain: ReturnType<typeof vi.fn>;
  oscillators: FakeOsc[];
  gains: FakeGain[];
}

function makeFakeCtx(state: string = 'running'): FakeCtx {
  const oscillators: FakeOsc[] = [];
  const gains: FakeGain[] = [];
  return {
    currentTime: 0,
    state,
    destination: {},
    resume: vi.fn(),
    createOscillator: vi.fn(() => {
      const o: FakeOsc = {
        type: '',
        frequency: { value: 0 },
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      };
      oscillators.push(o);
      return o;
    }),
    createGain: vi.fn(() => {
      const g: FakeGain = {
        gain: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
      };
      gains.push(g);
      return g;
    }),
    oscillators,
    gains,
  };
}

interface AudioWin {
  AudioContext?: unknown;
  webkitAudioContext?: unknown;
}

describe('ensureAudioCtx', () => {
  let originalAudioContext: unknown;
  let originalWebkit: unknown;

  beforeEach(() => {
    const w = window as unknown as AudioWin;
    originalAudioContext = w.AudioContext;
    originalWebkit = w.webkitAudioContext;
    // Force a fresh module-level cache by re-importing is impossible here, so
    // each test owns the global ctor and we live with the cached ctx between
    // tests — the cache survives by design, so we only assert behaviour that
    // tolerates either a fresh or cached ctx.
  });

  afterEach(() => {
    const w = window as unknown as AudioWin;
    if (originalAudioContext === undefined) delete w.AudioContext;
    else w.AudioContext = originalAudioContext;
    if (originalWebkit === undefined) delete w.webkitAudioContext;
    else w.webkitAudioContext = originalWebkit;
  });

  it('returns null when neither AudioContext nor webkitAudioContext exist', async () => {
    const w = window as unknown as AudioWin;
    delete w.AudioContext;
    delete w.webkitAudioContext;
    // Reload module to clear cached ctx.
    vi.resetModules();
    const mod = await import('../src/lib/audio');
    expect(mod.ensureAudioCtx()).toBeNull();
  });

  it('resumes a suspended context', async () => {
    const ctx = makeFakeCtx('suspended');
    const Ctor = vi.fn(() => ctx);
    (window as unknown as AudioWin).AudioContext = Ctor;
    vi.resetModules();
    const mod = await import('../src/lib/audio');
    mod.ensureAudioCtx();
    expect(ctx.resume).toHaveBeenCalled();
  });

  it('reuses a cached context across calls', async () => {
    const Ctor = vi.fn(() => makeFakeCtx('running'));
    (window as unknown as AudioWin).AudioContext = Ctor;
    vi.resetModules();
    const mod = await import('../src/lib/audio');
    mod.ensureAudioCtx();
    mod.ensureAudioCtx();
    mod.ensureAudioCtx();
    expect(Ctor).toHaveBeenCalledTimes(1);
  });

  it('falls back to webkitAudioContext when AudioContext is absent', async () => {
    const w = window as unknown as AudioWin;
    delete w.AudioContext;
    const Ctor = vi.fn(() => makeFakeCtx('running'));
    w.webkitAudioContext = Ctor;
    vi.resetModules();
    const mod = await import('../src/lib/audio');
    mod.ensureAudioCtx();
    expect(Ctor).toHaveBeenCalled();
  });

  it('swallows constructor exceptions and returns null', async () => {
    (window as unknown as AudioWin).AudioContext = vi.fn(() => { throw new Error('blocked'); });
    vi.resetModules();
    const mod = await import('../src/lib/audio');
    expect(mod.ensureAudioCtx()).toBeNull();
  });
});

describe('beep', () => {
  it('is a no-op when soundOn is false', () => {
    const ctx = makeFakeCtx('running');
    (window as unknown as AudioWin).AudioContext = vi.fn(() => ctx);
    beep('tick', false);
    expect(ctx.createOscillator).not.toHaveBeenCalled();
  });

  it('creates 3 oscillators for the alarm pattern', async () => {
    const ctx = makeFakeCtx('running');
    (window as unknown as AudioWin).AudioContext = vi.fn(() => ctx);
    vi.resetModules();
    const mod = await import('../src/lib/audio');
    mod.beep('alarm', true);
    expect(ctx.oscillators).toHaveLength(3);
    expect(ctx.oscillators.every((o) => o.type === 'square')).toBe(true);
  });

  it('creates 4 oscillators for the evolution pattern', async () => {
    const ctx = makeFakeCtx('running');
    (window as unknown as AudioWin).AudioContext = vi.fn(() => ctx);
    vi.resetModules();
    const mod = await import('../src/lib/audio');
    mod.beep('evolution', true);
    expect(ctx.oscillators).toHaveLength(4);
    expect(ctx.oscillators.every((o) => o.type === 'triangle')).toBe(true);
  });

  it.each([
    ['tick', 880],
    ['work', 660],
    ['rest', 440],
    ['warmup', 520],
    ['cooldown', 392],
  ] as const)('uses freq %s -> %i for simple beep kind', async (kind, freq) => {
    const ctx = makeFakeCtx('running');
    (window as unknown as AudioWin).AudioContext = vi.fn(() => ctx);
    vi.resetModules();
    const mod = await import('../src/lib/audio');
    mod.beep(kind, true);
    expect(ctx.oscillators).toHaveLength(1);
    expect(ctx.oscillators[0].frequency.value).toBe(freq);
  });

  it('swallows audio-graph exceptions silently', async () => {
    const ctx = makeFakeCtx('running');
    ctx.createOscillator = vi.fn(() => { throw new Error('blocked'); });
    (window as unknown as AudioWin).AudioContext = vi.fn(() => ctx);
    vi.resetModules();
    const mod = await import('../src/lib/audio');
    expect(() => mod.beep('tick', true)).not.toThrow();
  });
});

describe('requestNotificationPerm', () => {
  const g = globalThis as { Notification?: unknown };
  let original: unknown;

  beforeEach(() => { original = g.Notification; });
  afterEach(() => {
    if (original === undefined) delete g.Notification;
    else g.Notification = original;
  });

  it('returns false when Notification API is unavailable', async () => {
    delete g.Notification;
    await expect(requestNotificationPerm()).resolves.toBe(false);
  });

  it('returns true when already granted without prompting', async () => {
    const stub = { permission: 'granted', requestPermission: vi.fn() };
    g.Notification = stub;
    await expect(requestNotificationPerm()).resolves.toBe(true);
    expect(stub.requestPermission).not.toHaveBeenCalled();
  });

  it('returns false when already denied without prompting', async () => {
    const stub = { permission: 'denied', requestPermission: vi.fn() };
    g.Notification = stub;
    await expect(requestNotificationPerm()).resolves.toBe(false);
    expect(stub.requestPermission).not.toHaveBeenCalled();
  });

  it('prompts and resolves true on accept', async () => {
    const stub = { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') };
    g.Notification = stub;
    await expect(requestNotificationPerm()).resolves.toBe(true);
    expect(stub.requestPermission).toHaveBeenCalled();
  });

  it('prompts and resolves false on dismissal', async () => {
    const stub = { permission: 'default', requestPermission: vi.fn().mockResolvedValue('dismissed') };
    g.Notification = stub;
    await expect(requestNotificationPerm()).resolves.toBe(false);
  });
});
