import type { BeepKind } from '../store/types';

let audioCtx: AudioContext | null = null;

interface WebkitWindow extends Window { webkitAudioContext?: typeof AudioContext }

export function ensureAudioCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor = window.AudioContext || (window as WebkitWindow).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

export function beep(kind: BeepKind, soundOn: boolean): void {
  if (!soundOn) return;
  const ctx = ensureAudioCtx();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;

    if (kind === 'alarm') {
      [880, 988, 1100].forEach((f, i) => {
        const oo = ctx.createOscillator(), gg = ctx.createGain();
        oo.connect(gg); gg.connect(ctx.destination);
        oo.type = 'square'; oo.frequency.value = f;
        const t = now + i * 0.18;
        gg.gain.setValueAtTime(0.0001, t);
        gg.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
        gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
        oo.start(t); oo.stop(t + 0.18);
      });
      return;
    }

    if (kind === 'evolution') {
      [523, 659, 784, 1046].forEach((f, i) => {
        const oo = ctx.createOscillator(), gg = ctx.createGain();
        oo.connect(gg); gg.connect(ctx.destination);
        oo.type = 'triangle'; oo.frequency.value = f;
        const t = now + i * 0.15;
        gg.gain.setValueAtTime(0.0001, t);
        gg.gain.exponentialRampToValueAtTime(0.22, t + 0.02);
        gg.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        oo.start(t); oo.stop(t + 0.3);
      });
      return;
    }

    const profile: Record<Exclude<BeepKind, 'alarm' | 'evolution'>, { freq: number; dur: number }> = {
      tick:     { freq: 880, dur: 0.06 },
      work:     { freq: 660, dur: 0.18 },
      rest:     { freq: 440, dur: 0.18 },
      warmup:   { freq: 520, dur: 0.18 },
      cooldown: { freq: 392, dur: 0.18 },
    };
    const { freq, dur } = profile[kind];
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = 'square'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.16, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    o.start(now); o.stop(now + dur);
  } catch {
    /* audio blocked */
  }
}

export async function requestNotificationPerm(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission !== 'denied') {
    const p = await Notification.requestPermission();
    return p === 'granted';
  }
  return false;
}
