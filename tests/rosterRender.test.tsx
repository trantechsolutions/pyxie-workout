import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { Sprite } from '../src/components/Sprite';
import { EggSprite } from '../src/components/EggSprite';
import { Hatch } from '../src/screens/Hatch';
import { Pet } from '../src/screens/Pet';
import { EVOLUTION_TREE } from '../src/data/evolutionTree';
import { PALETTES } from '../src/data/lineRegistry';
import { usePyxie } from '../src/store/usePyxie';
import { resetStore, makePet } from './helpers';
import type { Line } from '../src/store/types';

const LINES: Line[] = ['ember', 'tide', 'verdant', 'gale', 'stone', 'umbra', 'aurora', 'static'];

describe('Roster render robustness — 8 lines × all evolution-tree nodes', () => {
  it('has all 8 lines defined in PALETTES', () => {
    for (const line of LINES) {
      expect(PALETTES[line]).toBeDefined();
      expect(PALETTES[line].length).toBeGreaterThanOrEqual(6);
    }
  });

  it('renders every EVOLUTION_TREE node via Sprite without throwing', () => {
    const ids = Object.keys(EVOLUTION_TREE);
    expect(ids.length).toBeGreaterThan(0);
    let rendered = 0;
    for (const id of ids) {
      const node = EVOLUTION_TREE[id];
      expect(LINES).toContain(node.line);
      const { container, unmount } = render(
        <svg>
          <Sprite line={node.line} stage={node.stage} size={64} lineageId={id} />
        </svg>
      );
      const rects = container.querySelectorAll('rect');
      expect(rects.length).toBeGreaterThan(0);
      unmount();
      rendered++;
    }
    expect(rendered).toBe(ids.length);
  });

  it('renders Sprite for every line at every stage 0..4 without throwing', () => {
    for (const line of LINES) {
      for (let stage = 0; stage <= 4; stage++) {
        const { unmount } = render(
          <svg>
            <Sprite line={line} stage={stage} size={64} />
          </svg>
        );
        unmount();
      }
    }
  });
});

describe('Sprite — adversarial probes', () => {
  it('renders procedural placeholder for unknown lineageId without throwing', () => {
    const malformed = ['', 'not-a-real-id', 'ember-xxxxx', 'ember-zzzzzzzz', 'BOGUS', 'pap-ember'];
    for (const id of malformed) {
      const { container, unmount } = render(
        <svg>
          <Sprite line="ember" stage={2} size={64} lineageId={id} />
        </svg>
      );
      expect(container.querySelectorAll('rect').length).toBeGreaterThan(0);
      unmount();
    }
  });

  it('clamps out-of-range stages without throwing', () => {
    for (const stage of [-5, -1, 5, 99]) {
      const { unmount } = render(
        <svg>
          <Sprite line="ember" stage={stage} size={64} />
        </svg>
      );
      unmount();
    }
  });

  it('renders with seed-driven hue rotation', () => {
    const { container, unmount } = render(
      <svg>
        <Sprite line="aurora" stage={2} size={64} seed={1234567} />
      </svg>
    );
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(0);
    unmount();
  });
});

describe('EggSprite render', () => {
  it('renders without throwing', () => {
    const { container } = render(<EggSprite />);
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(0);
  });

  it('renders at various sizes', () => {
    for (const size of [16, 64, 200, 512]) {
      const { unmount } = render(<EggSprite size={size} />);
      unmount();
    }
  });
});

describe('Hatch screen renders for each line', () => {
  beforeEach(resetStore);

  it('renders Hatch without throwing', () => {
    const { container } = render(<Hatch />);
    expect(container).toBeTruthy();
  });
});

describe('Pet screen renders for every line (post-hatch)', () => {
  beforeEach(resetStore);

  for (const line of LINES) {
    it(`renders Pet for line=${line} at every stage`, () => {
      for (let stage = 0; stage <= 4; stage++) {
        resetStore();
        const lineageId = stage === 0 ? line : `${line}-${'p'.repeat(stage)}`;
        usePyxie.setState({
          pet: makePet({
            line,
            stage,
            xp: 30,
            workoutsToHatch: 0,
            lineageId,
          }),
        });
        const { unmount } = render(<Pet />);
        unmount();
      }
    });
  }

  it('renders Pet while in egg phase (workoutsToHatch > 0)', () => {
    usePyxie.setState({
      pet: makePet({ workoutsToHatch: 3, lineageId: '' }),
    });
    const { container } = render(<Pet />);
    expect(container.textContent).toContain('Egg');
  });

  it('renders Pet with a malformed lineageId (procedural placeholder path)', () => {
    usePyxie.setState({
      pet: makePet({ line: 'static', stage: 3, xp: 30, lineageId: 'static-zzzz' }),
    });
    const { unmount } = render(<Pet />);
    unmount();
  });
});
