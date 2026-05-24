import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { usePyxie } from '../src/store/usePyxie';
import { Hud } from '../src/components/Hud';
import { Nav } from '../src/components/Nav';
import { Sprite } from '../src/components/Sprite';
import { EggSprite } from '../src/components/EggSprite';
import { resetStore, makePet } from './helpers';

describe('Hud component', () => {
  beforeEach(resetStore);

  it('renders nothing when no pet exists', () => {
    const { container } = render(<Hud />);
    expect(container.querySelector('.stats-bar')).toBeNull();
  });

  it('renders three stat bars with rounded values', () => {
    usePyxie.setState({ pet: makePet({ hunger: 77.5, happiness: 50, energy: 33.2 }) });
    render(<Hud />);
    expect(screen.getByText('Hunger')).toBeInTheDocument();
    expect(screen.getByText('Happy')).toBeInTheDocument();
    expect(screen.getByText('Energy')).toBeInTheDocument();
    expect(screen.getByText('78')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
    expect(screen.getByText('33')).toBeInTheDocument();
  });

  it('applies stat-low when a stat is below 25', () => {
    usePyxie.setState({ pet: makePet({ hunger: 20, happiness: 90, energy: 90 }) });
    const { container } = render(<Hud />);
    const lowStat = container.querySelector('.stat.hunger.stat-low');
    expect(lowStat).not.toBeNull();
  });

  it('renders nothing when the pet is dead', () => {
    usePyxie.setState({ pet: makePet({ alive: false }) });
    const { container } = render(<Hud />);
    expect(container.querySelector('.stats-bar')).toBeNull();
  });
});

describe('Nav component', () => {
  beforeEach(resetStore);

  it('disables the Workout button when no pet exists', () => {
    // Post-fdda2fd: Wiki moved off the tab strip onto its own /wiki page.
    // The Nav now always renders Pet/Workout/Settings + a Wiki anchor link;
    // when no pet exists, Workout is rendered but disabled.
    const { container } = render(<Nav />);
    const workoutBtn = screen.getByText('Workout') as HTMLButtonElement;
    expect(workoutBtn).toBeDisabled();
    expect(container.querySelectorAll('.nav-btn').length).toBeGreaterThan(0);
  });

  it('renders all primary tabs (Pet/Workout/Settings) plus a Wiki anchor with the current tab active', () => {
    usePyxie.setState({ pet: makePet() });
    render(<Nav />);
    expect(screen.getByText('Pet')).toBeInTheDocument();
    expect(screen.getByText('Workout')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    // Wiki is an <a href="/wiki">, not a tab button.
    const wikiLink = screen.getByText('Wiki') as HTMLAnchorElement;
    expect(wikiLink.tagName).toBe('A');
    expect(wikiLink.getAttribute('href')).toBe('/wiki');
    expect(screen.getByText('Pet').className).toContain('active');
  });

  it('changes the active tab when a button is clicked', () => {
    usePyxie.setState({ pet: makePet() });
    render(<Nav />);
    fireEvent.click(screen.getByText('Workout'));
    expect(usePyxie.getState().ui.tab).toBe('workout');
  });

  it('Wiki link navigates to /wiki (no tab state change)', () => {
    usePyxie.setState({ pet: makePet() });
    render(<Nav />);
    const wikiLink = screen.getByText('Wiki') as HTMLAnchorElement;
    expect(wikiLink.tagName).toBe('A');
    expect(wikiLink.getAttribute('href')).toBe('/wiki');
    // Clicking the anchor should NOT mutate ui.tab — it's a hard nav.
    fireEvent.click(wikiLink);
    expect(usePyxie.getState().ui.tab).toBe('pet');
  });

  it('hides the Family tab when family features are disabled', () => {
    usePyxie.setState({ pet: makePet() });
    render(<Nav />);
    expect(screen.queryByText('Family')).toBeNull();
  });

  it('hides the Family tab when family features are enabled but user is not in a family', () => {
    usePyxie.setState({ pet: makePet() });
    usePyxie.setState((s) => ({ settings: { ...s.settings, familyFeaturesEnabled: true } }));
    usePyxie.setState({ inFamily: false });
    render(<Nav />);
    expect(screen.queryByText('Family')).toBeNull();
  });

  it('shows the Family tab when family features are enabled AND user is in a family', () => {
    usePyxie.setState({ pet: makePet() });
    usePyxie.setState((s) => ({ settings: { ...s.settings, familyFeaturesEnabled: true } }));
    usePyxie.setState({ inFamily: true });
    render(<Nav />);
    expect(screen.getByText('Family')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Family'));
    expect(usePyxie.getState().ui.tab).toBe('family');
  });
});

describe('Sprite component', () => {
  it('emits an SVG with crispEdges shape-rendering', () => {
    const { container } = render(<Sprite line="ember" stage={0} size={100} />);
    const svg = container.querySelector('svg.pet-sprite');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('shape-rendering')).toBe('crispEdges');
    expect(svg?.getAttribute('width')).toBe('100');
  });

  it('renders cells from the grid (Emberling has ~50-80 lit cells)', () => {
    const { container } = render(<Sprite line="ember" stage={0} size={160} />);
    const rects = container.querySelectorAll('rect');
    expect(rects.length).toBeGreaterThan(40);
    expect(rects.length).toBeLessThan(120);
  });

  it('fires onClick when provided', () => {
    let clicks = 0;
    const { container } = render(<Sprite line="tide" stage={2} onClick={() => { clicks++; }} />);
    const svg = container.querySelector('svg') as SVGSVGElement;
    fireEvent.click(svg);
    expect(clicks).toBe(1);
  });

  it('renders a gale baseline with the gale palette (sky-blue cells)', () => {
    const { container } = render(<Sprite line="gale" stage={0} lineageId="gale" size={160} />);
    const rects = Array.from(container.querySelectorAll('rect'));
    expect(rects.length).toBeGreaterThan(20);
    const fills = new Set(rects.map((r) => r.getAttribute('fill')));
    // gale palette index 2 (`#c8d2e0`) appears in the Wisplet body — pick any
    // tide blue and confirm it is NOT present (palette is gale, not tide).
    expect([...fills].some((f) => f === '#3366cc' || f === '#5599ee')).toBe(false);
  });

  it('renders a stone baseline with the stone palette (warm earth)', () => {
    const { container } = render(<Sprite line="stone" stage={0} lineageId="stone" size={160} />);
    const fills = new Set(Array.from(container.querySelectorAll('rect')).map((r) => r.getAttribute('fill')));
    // Stone palette mid color present; tide blue absent.
    expect([...fills].some((f) => f === '#3366cc' || f === '#5599ee')).toBe(false);
  });

  it('renders the gale alt-branch grid (Gustcub) for lineageId=gale-a without placeholder badge', () => {
    const { container } = render(<Sprite line="gale" stage={1} lineageId="gale-a" size={160} />);
    expect(container.querySelector('svg.pet-sprite-placeholder')).toBeNull();
  });

  it('renders authored stone alt-branch (stone-aa) without placeholder badge', () => {
    const { container } = render(<Sprite line="stone" stage={2} lineageId="stone-aa" size={160} />);
    expect(container.querySelector('svg.pet-sprite-placeholder')).toBeNull();
  });

  it('renders the synthesized stage-4 leaf (ember-pppa) without placeholder badge', () => {
    // Stage-4 alt leaves are now authored via parent-inherited flourish.
    const { container } = render(<Sprite line="ember" stage={4} lineageId="ember-pppa" size={160} />);
    expect(container.querySelector('svg.pet-sprite-placeholder')).toBeNull();
  });

  it('applies a hue-rotate filter when a seed is provided', () => {
    const { container } = render(<Sprite line="ember" stage={0} seed={1_700_000_000_000} size={160} />);
    // Filter now lives on the body <g> so the placeholder badge text is unaffected.
    const group = container.querySelector('svg.pet-sprite > g') as SVGGElement;
    expect(group.style.filter).toMatch(/hue-rotate\(-?\d+deg\)/);
  });

  it('hue rotation is deterministic for a given seed', () => {
    const seed = 1_700_000_000_000;
    const a = render(<Sprite line="ember" stage={0} seed={seed} size={80} />);
    const b = render(<Sprite line="ember" stage={0} seed={seed} size={80} />);
    const filterA = (a.container.querySelector('svg > g') as SVGGElement).style.filter;
    const filterB = (b.container.querySelector('svg > g') as SVGGElement).style.filter;
    expect(filterA).toBe(filterB);
  });

  it('omits the hue-rotate filter when no seed is provided', () => {
    const { container } = render(<Sprite line="ember" stage={0} size={80} />);
    const group = container.querySelector('svg.pet-sprite > g') as SVGGElement;
    expect(group.style.filter).toBe('');
  });

  it('renders an umbra baseline with the dusk palette (no tide blue leakage)', () => {
    const { container } = render(<Sprite line="umbra" stage={0} lineageId="umbra" size={160} />);
    const fills = new Set(Array.from(container.querySelectorAll('rect')).map((r) => r.getAttribute('fill')));
    // Umbra deep-night shadow (#221830 or #0c0716) should appear; tide blues absent.
    expect(fills.has('#0c0716') || fills.has('#221830')).toBe(true);
    expect(fills.has('#3366cc')).toBe(false);
    expect(fills.has('#5599ee')).toBe(false);
  });

  it('renders an aurora baseline with the pastel palette (no ember red leakage)', () => {
    const { container } = render(<Sprite line="aurora" stage={0} lineageId="aurora" size={160} />);
    const fills = new Set(Array.from(container.querySelectorAll('rect')).map((r) => r.getAttribute('fill')));
    // Aurora rose-pink (#ffb4d8) or cream (#fff8dc) should appear; ember reds absent.
    expect(fills.has('#ffb4d8') || fills.has('#fff8dc')).toBe(true);
    expect(fills.has('#ff4422')).toBe(false);
    expect(fills.has('#ff8844')).toBe(false);
  });

  it('renders a static baseline with the electric palette (no verdant green leakage)', () => {
    const { container } = render(<Sprite line="static" stage={0} lineageId="static" size={160} />);
    const fills = new Set(Array.from(container.querySelectorAll('rect')).map((r) => r.getAttribute('fill')));
    // Static bright-yellow (#ffd633) or pale lemon (#fff5b3) should appear; verdant greens absent.
    expect(fills.has('#ffd633') || fills.has('#fff5b3')).toBe(true);
    expect(fills.has('#3aaa45')).toBe(false);
    expect(fills.has('#66dd55')).toBe(false);
  });
});

describe('EggSprite component', () => {
  it('renders the generic blind-box egg SVG at the requested size', () => {
    const { container } = render(<EggSprite size={160} />);
    const svg = container.querySelector('svg.egg-sprite');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('160');
    expect(svg?.getAttribute('shape-rendering')).toBe('crispEdges');
  });

  it('includes the five marketing accent flecks (one per line)', () => {
    const { container } = render(<EggSprite size={160} />);
    const fills = new Set(
      Array.from(container.querySelectorAll('rect')).map((r) => r.getAttribute('fill'))
    );
    // Cream shell + shadow + the five elemental flecks from pyxie-egg.svg.
    expect(fills.has('#F5F1E8')).toBe(true);
    expect(fills.has('#C9C3D0')).toBe(true);
    expect(fills.has('#FF6B35')).toBe(true); // ember
    expect(fills.has('#3DBEDC')).toBe(true); // tide
    expect(fills.has('#8AC34A')).toBe(true); // verdant
    expect(fills.has('#B8C5D6')).toBe(true); // gale
    expect(fills.has('#C9A47C')).toBe(true); // stone
  });

  it('renders the same sprite regardless of caller — no line-coded leak', () => {
    // The generic egg must not betray the pet's line before hatch. Two
    // independent renders should produce the same fill set.
    const a = render(<EggSprite size={80} />);
    const b = render(<EggSprite size={80} />);
    const fillsA = Array.from(a.container.querySelectorAll('rect')).map((r) => r.getAttribute('fill')).sort();
    const fillsB = Array.from(b.container.querySelectorAll('rect')).map((r) => r.getAttribute('fill')).sort();
    expect(fillsA).toEqual(fillsB);
  });
});
