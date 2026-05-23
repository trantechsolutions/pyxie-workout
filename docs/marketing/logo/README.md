# Pyxie — Logo System

Eight-line refresh of the mystery-egg mark. The lead concept is documented in `../brand-guide.md` § 5.

## What's in this folder

| File | Use |
|---|---|
| `pyxie-egg.svg` | Primary mark. Full eight-color speckle. Use on Bonelight or any light surface. |
| `pyxie-egg-mono.svg` | Mono — Voidscreen on transparent. For dark text on light backgrounds when a single-color mark is required. |
| `pyxie-egg-mono-cloud.svg` | Mono — Bonelight on transparent. For reversed contexts (Voidscreen / Twilight backgrounds). |
| `pyxie-egg-favicon.svg` | Favicon. 16×16 viewBox. Three-fleck simplified speckle (Ember + Tide + Verdant) — eight colors at 1px each is noise. |
| `pyxie-logo-horizontal.svg` | Horizontal lockup — egg left, "pyxie" wordmark right. Default sign-off mark for headers, footers, share cards. |
| `pyxie-logo-stacked.svg` | Stacked lockup — egg above wordmark. Use when horizontal space is constrained (square avatars, app store icons). |
| `pyxie-palette.svg` | Reference card. All eight elemental swatches with hex values. For pitch decks, brand docs, internal handoffs — not a public asset. |

## The eight flecks

Each fleck represents one elemental line. Position is fixed in the mark — do not rearrange.

| Fleck | Line | Hex |
|---|---|---|
| 🟧 | Ember | `#FF6B35` |
| 🩵 | Tide | `#3DBEDC` |
| 🟩 | Verdant | `#8AC34A` |
| ⚪ | Gale | `#B8C5D6` |
| 🟫 | Stone | `#C9A47C` |
| 🟪 | Umbra | `#A89BC4` |
| 🌸 | Aurora | `#FFB4D8` |
| 🟡 | Static | `#FFEA66` |

## Clear space

Minimum clear space around the mark: **one row of the egg grid** (≈10 units in the 160-unit viewBox, ≈6% of the mark's width). Nothing inside this zone — no copy, no other marks, no edge of a container.

## Minimum size

- **Egg mark alone:** 24×24px. Below that, switch to the favicon.
- **Horizontal lockup:** 160px wide. Below that, the wordmark loses readability — switch to the mark alone.
- **Stacked lockup:** 80×60px.
- **Favicon:** 16×16px is the design target; renders cleanly down to that size.

## Color rules

- **Default surface is Bonelight** (`#F5F1E8`). The mark is drawn for a warm off-white background, not pure white.
- **On Voidscreen** (`#14121C`) or dark Twilight surfaces, use `pyxie-egg-mono-cloud.svg`. The full-color version on dark loses the speckle contrast.
- **Never recolor the flecks.** The eight hues are brand-locked. You can't substitute Aurora pink with a brand-adjacent pink; the speckle pattern is the fingerprint.
- **Never add a sixth, ninth, or any extra fleck.** If a new line ships, this file gets updated — don't improvise in marketing.

## The `i`-dot accent (web/animated contexts only)

Per brand-guide § 5: in animated or interactive web contexts, the dot of `i` in the wordmark may be colored **Ember-glow** (`#F4A261`) as a small "life signal." The shipped SVGs in this folder use Voidscreen for the full word — Ember-glow is applied via CSS on the rendering site, not baked into the SVG.

```css
.pyxie-wordmark .i-dot { fill: #F4A261; }
```

Never in print. Never in the favicon.

## Wordmark font

The wordmark uses **Departure Mono** with a fallback stack of `JetBrains Mono`, `IBM Plex Mono`, `ui-monospace`, `monospace`. For surfaces where the font cannot be loaded (print, third-party platforms that strip fonts), convert the text to paths before export.

## How to use these files

- **Web:** Drop the SVGs directly. They're optimized — no extra processing needed.
- **App icon / store listings:** Export `pyxie-egg.svg` to PNG at 1024×1024, then downsample for each target size. Don't let the export tool re-render with anti-aliasing — the stair-step edges are the brand DNA. Set `shape-rendering="crispEdges"` is honored in modern exporters; for legacy tools, render at integer multiples of the egg grid.
- **Print:** Export at 300dpi PDF or use the SVG directly. Two-color limit; no gradients.
- **Screenshots / pitch decks:** The palette card (`pyxie-palette.svg`) is a quick-grab reference, not a customer-facing asset.

## Don'ts

- No gradients, no drop shadows, no 3D bevel, no glow.
- No rotating, mirroring, or stretching the mark.
- No isolating a single fleck and using it as an icon — flecks only exist inside the egg.
- No rendering the mark on a colored elemental background (Ember red, Tide cyan, etc.). The mark sits on parent-palette neutrals only.
- No anti-aliasing the pixel edges at logo sizes. The stair-step is the point.
