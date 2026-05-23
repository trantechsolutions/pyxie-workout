// Shared blind-box egg grid. Single source-of-truth consumed by both
// `EggSprite.tsx` (runtime renderer) and the registry test suite. Chars are:
//   '.'  empty
//   'C'  shell
//   'S'  shadow
//   per-line fleck char (defined in LINE_REGISTRY[line].eggFleck.char)
//
// The grid is NOT a renderer-alphabet sprite (it uses letters, not '1'..'8')
// so it deliberately bypasses `parseGrid`. Shape (16×16) is asserted here.

const RAW_EGG_GRID: readonly string[] = [
  '................',
  '................',
  '.......CC.......',
  '......CCCC......',
  '.....CCCCAS.....',
  '....CCOCCCCS....',
  '....UCCCCCCS....',
  '....CCCCBCCS....',
  '....CCCCCCCS....',
  '....CGCCCCYS....',
  '....CCCCCLCS....',
  '....CCCCCCCS....',
  '.....CCNCCS.....',
  '......CCCS......',
  '................',
  '................',
];

if (RAW_EGG_GRID.length !== 16) {
  throw new Error(`EGG_GRID: expected 16 rows, got ${RAW_EGG_GRID.length}`);
}
for (let y = 0; y < 16; y++) {
  if (RAW_EGG_GRID[y].length !== 16) {
    throw new Error(`EGG_GRID: row ${y} must be 16 chars, got length=${RAW_EGG_GRID[y].length}`);
  }
}

export const EGG_GRID: readonly string[] = RAW_EGG_GRID;

export const EGG_SHELL_CHAR = 'C';
export const EGG_SHADOW_CHAR = 'S';
