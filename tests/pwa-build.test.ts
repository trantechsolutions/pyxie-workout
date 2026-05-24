import { describe, it, expect } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DIST = resolve(__dirname, '..', 'dist');
const distExists = existsSync(DIST);
const d = distExists ? describe : describe.skip;

d('PWA build output (run `npm run build` first)', () => {
  it('emits dist/manifest.webmanifest with required Pyxie fields', () => {
    const path = join(DIST, 'manifest.webmanifest');
    expect(existsSync(path)).toBe(true);
    const m = JSON.parse(readFileSync(path, 'utf-8'));
    expect(m.name).toBe('Pyxie — Pet Calisthenics');
    expect(m.short_name).toBe('Pyxie');
    expect(m.display).toBe('standalone');
    expect(m.theme_color).toBe('#0a0418');
    expect(Array.isArray(m.icons)).toBe(true);
    expect(m.icons.length).toBeGreaterThanOrEqual(2);
  });

  it('every declared icon file exists in dist/', () => {
    const m = JSON.parse(readFileSync(join(DIST, 'manifest.webmanifest'), 'utf-8'));
    for (const icon of m.icons as Array<{ src: string }>) {
      const iconPath = join(DIST, icon.src.replace(/^\//, ''));
      expect(existsSync(iconPath), `missing icon: ${icon.src}`).toBe(true);
      expect(statSync(iconPath).size).toBeGreaterThan(0);
    }
  });

  it('emits a service worker referencing a precache manifest', () => {
    const candidates = ['sw.js', 'service-worker.js'];
    const swName = candidates.find((n) => existsSync(join(DIST, n)));
    expect(swName, 'no service worker emitted').toBeDefined();
    const sw = readFileSync(join(DIST, swName!), 'utf-8');
    expect(sw).toMatch(/precache|workbox/i);
  });

  it('registers the Google Fonts runtime cache (StaleWhileRevalidate)', () => {
    const swFile = readdirSync(DIST).find((f: string) => /^(sw|service-worker|workbox-).*\.js$/.test(f));
    expect(swFile).toBeDefined();
    const allSw = readdirSync(DIST)
      .filter((f: string) => f.endsWith('.js'))
      .map((f: string) => readFileSync(join(DIST, f), 'utf-8'))
      .join('\n');
    expect(allSw).toMatch(/fonts\.googleapis\.com|pyxie-fonts/);
  });
});
