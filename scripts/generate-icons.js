// Generates PWA icon assets for Pyxie from the Emberling sprite.
// Outputs:
//   icons/icon.svg              (1024x1024 master, transparent-free for any-purpose)
//   icons/icon-maskable.svg     (1024x1024, sprite in 80% safe zone)
//   icons/apple-touch-icon.png  (180x180, opaque background)
// Dependency-free: uses only Node built-ins (fs, path, zlib).

const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const OUT = path.join(__dirname, '..', 'icons');
fs.mkdirSync(OUT, { recursive: true });

// --- Sprite data (Emberling, from pyxie.html CREATURES.ember[0]) ---
const GRID = [
  '................',
  '................',
  '................',
  '.......32.......',
  '......3221......',
  '.....322321.....',
  '....32263321....',
  '....32263321....',
  '....32213321....',
  '....37822321....',
  '....32183321....',
  '....32213321....',
  '.....322321.....',
  '......32221.....',
  '................',
  '................',
];

const PALETTE = {
  '1': '#ff4422',
  '2': '#ff8844',
  '3': '#ffcc66',
  '4': '#aa1100',
  '5': '#ffee99',
  '6': '#5a0d00',
  '7': '#ffffff',
  '8': '#1a0a0a',
};

const BG_DEEP = '#0a0418';
const BG_MID  = '#2a1560';

// --- SVG generation ---
function spriteRects(cellSize, offsetX, offsetY) {
  const rects = [];
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = GRID[y][x];
      if (ch === '.') continue;
      const color = PALETTE[ch];
      if (!color) continue;
      const px = offsetX + x * cellSize;
      const py = offsetY + y * cellSize;
      rects.push(`<rect x="${px}" y="${py}" width="${cellSize}" height="${cellSize}" fill="${color}"/>`);
    }
  }
  return rects.join('');
}

function starfield(seed = 1) {
  // Deterministic pseudo-random stars so the icon renders identically on every build.
  let s = seed;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const colors = ['#ffffff', '#ffd866', '#7df9ff', '#ff77c6'];
  const out = [];
  for (let i = 0; i < 40; i++) {
    const cx = Math.floor(rand() * 1024);
    const cy = Math.floor(rand() * 1024);
    const r  = rand() < 0.15 ? 3 : 2;
    const c  = colors[Math.floor(rand() * colors.length)];
    out.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${c}" opacity="0.85"/>`);
  }
  return out.join('');
}

function buildSvg({ cellSize, offsetX, offsetY }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024" shape-rendering="crispEdges">
  <defs>
    <radialGradient id="bg" cx="50%" cy="0%" r="80%">
      <stop offset="0%" stop-color="${BG_MID}"/>
      <stop offset="100%" stop-color="${BG_DEEP}"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  ${starfield(7)}
  ${spriteRects(cellSize, offsetX, offsetY)}
</svg>`;
}

// any-purpose: sprite fills ~75% of canvas
const anySvg = buildSvg({ cellSize: 48, offsetX: (1024 - 16 * 48) / 2, offsetY: (1024 - 16 * 48) / 2 });
// maskable: sprite fills ~62% (inside 80% safe zone)
const maskSvg = buildSvg({ cellSize: 40, offsetX: (1024 - 16 * 40) / 2, offsetY: (1024 - 16 * 40) / 2 });

fs.writeFileSync(path.join(OUT, 'icon.svg'), anySvg);
fs.writeFileSync(path.join(OUT, 'icon-maskable.svg'), maskSvg);

// --- Apple touch icon (180x180 PNG, manually encoded, dep-free) ---
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Render a 180x180 RGBA buffer.
function renderAppleIcon() {
  const W = 180, H = 180;
  const buf = Buffer.alloc(W * H * 4);

  // Background: vertical gradient BG_MID -> BG_DEEP
  const [r1, g1, b1] = hexToRgb(BG_MID);
  const [r2, g2, b2] = hexToRgb(BG_DEEP);
  for (let y = 0; y < H; y++) {
    const t = Math.min(1, y / (H * 0.8));
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
    }
  }

  // Sprite: 16x16 grid scaled to 10px per cell = 160px sprite centered (10px padding each side).
  const cell = 10;
  const ox = (W - 16 * cell) / 2;
  const oy = (H - 16 * cell) / 2;
  for (let gy = 0; gy < 16; gy++) {
    for (let gx = 0; gx < 16; gx++) {
      const ch = GRID[gy][gx];
      if (ch === '.') continue;
      const color = PALETTE[ch];
      if (!color) continue;
      const [r, g, b] = hexToRgb(color);
      for (let dy = 0; dy < cell; dy++) {
        for (let dx = 0; dx < cell; dx++) {
          const px = ox + gx * cell + dx;
          const py = oy + gy * cell + dy;
          const i = (py * W + px) * 4;
          buf[i] = r; buf[i + 1] = g; buf[i + 2] = b; buf[i + 3] = 255;
        }
      }
    }
  }
  return { width: W, height: H, data: buf };
}

// --- Minimal PNG encoder (RGBA, no filters) ---
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function encodePng({ width, height, data }) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;       // bit depth
  ihdr[9] = 6;       // color type RGBA
  ihdr[10] = 0;      // compression
  ihdr[11] = 0;      // filter
  ihdr[12] = 0;      // interlace

  // Add filter byte 0 at the start of every scanline.
  const raw = Buffer.alloc(height * (width * 4 + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    data.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = zlib.deflateSync(raw);

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const png = encodePng(renderAppleIcon());
fs.writeFileSync(path.join(OUT, 'apple-touch-icon.png'), png);

console.log('icons/icon.svg              ', anySvg.length, 'bytes');
console.log('icons/icon-maskable.svg     ', maskSvg.length, 'bytes');
console.log('icons/apple-touch-icon.png  ', png.length, 'bytes');
