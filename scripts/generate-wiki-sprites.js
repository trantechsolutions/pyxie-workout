// Extracts CREATURES + PALETTES from pyxie.html and renders one SVG sprite
// per evolution form into docs/wiki/sprites/{line}-{stage}.svg.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'creatures.ts'), 'utf8');
const OUT = path.join(__dirname, '..', 'docs', 'wiki', 'sprites');
fs.mkdirSync(OUT, { recursive: true });

// Strip ES module + TS syntax and eval in a vm sandbox.
const code = SRC
  .replace(/^import[^;]+;/gm, '')
  .replace(/^export\s+(const|interface)\s+/gm, '$1 ')
  .replace(/:\s*Record<[^>]+>/g, '')
  .replace(/:\s*readonly\s+string\[\]/g, '')
  .replace(/^interface\s+\w+\s*\{[^}]+\}/gm, '')
  + '\nmodule.exports = { PALETTES, CREATURES };';
const ctx = { module: { exports: {} } };
vm.createContext(ctx);
vm.runInContext(code, ctx);
const { PALETTES, CREATURES } = ctx.module.exports;

function render(line, stageIdx, size = 160) {
  const def = CREATURES[line][stageIdx];
  const palette = PALETTES[line];
  const cell = size / 16;
  let rects = '';
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const ch = def.grid[y][x];
      if (ch === '.') continue;
      let color;
      if (ch === '7') color = '#ffffff';
      else if (ch === '8') color = '#0a0a0a';
      else color = palette[parseInt(ch, 10) - 1] || '#888';
      rects += `<rect x="${(x*cell).toFixed(2)}" y="${(y*cell).toFixed(2)}" width="${(cell+0.5).toFixed(2)}" height="${(cell+0.5).toFixed(2)}" fill="${color}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#0a0418"/>${rects}</svg>`;
}

const manifest = [];
for (const line of ['ember', 'tide', 'verdant']) {
  for (let stage = 0; stage < CREATURES[line].length; stage++) {
    const svg = render(line, stage);
    const file = `${line}-${stage + 1}.svg`;
    fs.writeFileSync(path.join(OUT, file), svg);
    manifest.push({ line, stage: stage + 1, name: CREATURES[line][stage].name, file });
  }
}
console.log(`Rendered ${manifest.length} sprites to docs/wiki/sprites/`);
for (const m of manifest) console.log(`  ${m.line}-${m.stage} ${m.name.padEnd(12)} → ${m.file}`);
