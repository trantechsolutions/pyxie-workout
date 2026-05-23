# Pyxie Brand Guide

The smallest set of rules that keeps every Pyxie surface — landing page, app UI, social post, store listing — feeling like it came from the same place.

> Pyxie is a virtual pet that lives or dies by your workouts. The brand has to hold both halves: the warmth of a creature you're raising, and the stakes of one you can lose. Cute alone is wrong. Brutal alone is wrong. The brand sits in the seam.

---

## 1. Brand personality

**Pyxie is a knowing companion who tells you the truth.**

Picture a Game Boy-era pet game written by someone who has actually worked out, lost streaks, and grieved a Tamagotchi. Not a cheerleader. Not a drill sergeant. Something dryer, with care underneath.

Three personality pillars:

| Pillar | Means | Doesn't mean |
|---|---|---|
| **Warm** | Rooting for you. Pet sprites are expressive. Empty states are kind. | Saccharine. "You got this!" energy. |
| **Wry** | Plays the permadeath honestly, sometimes darkly funny about it. | Mean. Punishing. Shaming you for skipping. |
| **Crafted** | Pixel-game nostalgia executed with modern restraint. Tight type, careful color. | Kitsch. Random retro stickers. 8-bit everything. |

---

## 2. Voice

We sound: **Wry, honest, warm — in that order.**

For example, we are:
- **Wry** — meaning we treat the permadeath premise as a feature, not a warning label. We can joke about it because we mean it.
- **Honest** — meaning we never overpromise transformation, abs, or "your best self." We promise a pet that needs you to show up.
- **Warm** — meaning the joke is always *with* the reader, never at them. Missing a day is a thing that happens. The pet is sad; you are not bad.

We are NOT:
- Hustle-bro ("crush it," "no excuses," "grind")
- Wellness-app saccharine ("your journey," "honor your body," "you've got this")
- Tech-bro ("revolutionary fitness platform," "AI-powered")
- Childish ("hehe little pet go brrr")

### On-brand vs off-brand

| Situation | On-brand | Off-brand |
|---|---|---|
| Tagline | "Your pet eats your workouts." | "Get fit with your virtual companion!" |
| Missed-day notification | "Charwyrm hasn't eaten since Tuesday." | "Don't forget to work out today! 💪" |
| Onboarding | "Pick a starter. It can't be undone — that's kind of the point." | "Welcome to your fitness journey! Choose a friend!" |
| Pet death screen | "Drakorath is gone. You can hatch another egg whenever you're ready." | "Oh no! Your pet has fainted! Try again!" |
| Waitlist confirmation | "You're in. We'll email when there's something to hatch." | "🎉 Thanks for joining the Pyxie family!" |
| Empty state (no workouts logged) | "Nothing's hatching until you move." | "Get started by logging your first workout!" |

### Banned phrases

- "Crush it" / "smash it" / "level up your fitness"
- "Your journey" / "your best self"
- "We're thrilled / excited / honored"
- "Revolutionary" / "next-gen" / "AI-powered"
- "Buddy" / "companion" / "furry friend" (call it a *pet* or its name)
- "Game-ifies" / "gamification" (show it; don't say it)
- "Don't forget" anything (passive-aggressive, off-tone)

### House style

- **Sentence case everywhere.** No Title Case Buttons.
- **Pet names are proper nouns.** *Drakorath, Cinderpup, Charwyrm.* Always capitalised.
- **Stage / form / line are lowercase** in body copy unless starting a sentence.
- **Numerals over words for stats** ("60 XP," not "sixty XP"). Words for emotional beats ("two days without food").
- **Oxford comma. UK or US spelling — pick one per surface, don't mix.** (Default: US.)

---

## 3. Color system

The brand sits at two levels: a **parent palette** for the Pyxie world (used on the landing page, marketing, app shell, system UI), and **eight elemental palettes** for Ember / Tide / Verdant / Gale / Stone / Umbra / Aurora / Static (used inside the app where a pet is on screen).

### Parent palette — the Pyxie world

Mood: a Game Boy at dusk. Off-black, bone-cream, one mystical accent that doesn't fight the elementals.

#### Primary
- **Twilight**       `#4C3A78` — primary brand color. CTAs, brand mark, link accents. Reads as "the world pets live in" — neutral to all three elements, mystical without being purple-purple.

#### Secondary
- **Ember-glow**     `#F4A261` — secondary accent only. Used sparingly for energy moments (XP gain, evolution flash). Borrowed warmth from the Ember line so the parent brand feels alive.

#### Neutrals
- **Voidscreen**     `#14121C` — body text on light, backgrounds on dark. Off-black with a purple undertone so it harmonises with Twilight.
- **Ash**            `#5A5566` — secondary text, captions, muted UI.
- **Mist**           `#D6D2DE` — borders, dividers, inactive states.
- **Bonelight**      `#F5F1E8` — primary background, surfaces. Warm off-white. Reads as old paper / hatched-egg shell, not clinical white.

#### Semantic
- **Alive**          `#5BA76B` — success, pet healthy, streak active.
- **Hungry**         `#E0A93B` — warning, stat decay, missed-day nudge.
- **Starved**        `#C7472E` — error, pet critical, permadeath.
- **Info**           `#4C3A78` — same as Twilight (deliberate — info is brand).

### Elemental sub-palettes

Each line gets a 3-color palette used **only when that pet is on screen.** Never mix elementals on the same surface.

| Line | Hot | Mid | Deep |
|---|---|---|---|
| 🔥 **Ember** | `#FF6B35` | `#D9381E` | `#5C1A0E` |
| 💧 **Tide** | `#3DBEDC` | `#1A6F9E` | `#0B2E4A` |
| 🌿 **Verdant** | `#8AC34A` | `#4A8B2F` | `#1F3D1A` |
| 🌬️ **Gale** | `#B8C5D6` | `#6B7F99` | `#2C3847` |
| 🪨 **Stone** | `#C9A47C` | `#8B6B47` | `#3D2B1F` |
| 🌑 **Umbra** | `#A89BC4` | `#7C6D8F` | `#221830` |
| 🌸 **Aurora** | `#FFB4D8` | `#C48BA8` | `#5A3A4A` |
| ⚡ **Static** | `#FFEA66` | `#C9B53D` | `#5A4A0E` |

### Usage rules

- **Twilight on at most 20% of any screen.** It's the brand color, not the wallpaper.
- **Ember-glow is a spice, not a base.** Use for moments of energy (a CTA hover, an evolution flash, a single highlighted word). Never as a large fill.
- **Bonelight is the default background** — not white, not gray. Marketing surfaces feel different from generic SaaS because of this single choice.
- **No pure black, no pure white.** Voidscreen and Bonelight always.
- **Elemental palettes belong to the pet, not the UI.** Buttons and nav stay parent palette even when a Tide pet is on screen — the pet brings the color, the app doesn't shift to match.
- **All text/background combos must pass WCAG AA** (4.5:1 body, 3:1 large text). Voidscreen on Bonelight = 14.8:1. Twilight on Bonelight = 8.2:1. Bonelight on Twilight = 8.2:1. All pass.

---

## 4. Typography

Two-typeface system. One modern humanist sans for everything readable, one pixel face used **surgically** for personality — never for body, never for anything longer than a phrase.

### Headings & body
- **Font:** [Geist](https://vercel.com/font), weights 400, 500, 600, 700
- **Used for:** H1–H6, body, navigation, buttons, labels, microcopy — basically everything

### Display accent (use sparingly)
- **Font:** [Departure Mono](https://departuremono.com/) — a refined pixel/mono typeface that reads as "old game UI" without looking like a meme
- **Used for:** Pet names in marketing, stat readouts ("60 XP"), the wordmark, occasional pull-quote treatment. Never body. Never anything longer than ~6 words.

### Type scale

| Token | Size / line-height / weight | Use |
|---|---|---|
| Display | 64px / 64px / 700 | Hero headline only |
| H1 | 44px / 52px / 700 | Page titles |
| H2 | 32px / 40px / 600 | Section headers |
| H3 | 22px / 30px / 600 | Sub-sections |
| H4 | 18px / 26px / 600 | Card titles, small headers |
| Body L | 18px / 28px / 400 | Lead paragraphs, hero subhead |
| Body M | 16px / 24px / 400 | Default body |
| Body S | 14px / 20px / 400 | Captions, meta |
| Mono | 14px / 20px / 500 (Departure Mono) | Stat readouts, pet names in UI chrome |

### Rules
- **Line length 60–75 characters** for body. Wider fatigues.
- **Letter spacing:** -0.02em on Display and H1, -0.01em on H2/H3, 0 on body. Departure Mono: 0 (it's already wide).
- **Weight, not size, for emphasis** inside paragraphs. Bold the noun, don't enlarge it.
- **Mono is a treat.** If every other line is in Departure Mono, none of them are special.

---

## 5. Logo direction

Direction only — not the final mark. Pass to `repo-artist` or a designer for execution.

### Concept

Pyxie is a creature that *hatches from your effort*. The mark should hold that — an egg, a small life, or a vessel — with a pixel-game DNA showing through in the construction (visible grid, deliberate stair-step edges), but rendered cleanly enough to survive at 16×16.

### Style

- **Type:** Wordmark + small symbol (lockup), with each usable independently. Symbol works as the favicon and app icon.
- **Visual treatment:** Geometric, built on a pixel grid. Single-weight strokes. Two colors max — Twilight and Bonelight, with optional Ember-glow accent for animated moments only.
- **Feeling:** Wry, crafted, slightly mystical.

### Symbol concepts (three angles)

1. **The mystery egg.** A pixel egg silhouette on a 16×16 grid, speckled with eight scattered highlight pixels — one in each elemental hue (Ember orange, Tide cyan, Verdant green, Gale silver, Stone sand, Umbra violet, Aurora pink, Static yellow). The egg shows hints of every line but commits to none. Reads as "you don't know what's inside until you hatch" — which is the actual game. The speckle pattern doubles as a unique brand fingerprint no competitor can copy without theft. (At favicon size — 16×16 — the speckle drops to the three elder hues (Ember/Tide/Verdant) for legibility; full eight-fleck pattern is for logo-scale renders.)
2. **The XP heartbeat.** A horizontal progress bar that pulses — half stat-bar, half ECG line. Reads as "the pet runs on your effort." Strong as an animated favicon / loading state, weaker as a static mark.
3. **The vessel.** An open-topped pixel container (think Game Boy chassis cross-section) with a small spark inside. Reads as "Pyxie is the thing that holds the creature." More abstract; rewards a second look.

Recommend leading with **#1 (the mystery egg)**. It survives at 16×16, ties to the literal first moment in the product (blind-box hatch), and the five-color speckle is *visually unique* — most fitness/pet brand marks are flat single-symbol; ours has a built-in story.

### Wordmark

- Set in **Departure Mono** (or a custom-drawn variant matching its proportions), all lowercase: `pyxie`.
- Slight horizontal optical adjustment between letters (Departure Mono's default mono spacing reads stilted at brand sizes).
- The `i`'s dot can be the Ember-glow color in animated/web contexts as a tiny life signal — never in print or favicon.

### Do's
- Single-weight strokes throughout.
- Pixel grid must be visible at large sizes — that's the brand DNA.
- Symbol must read at 16×16 (favicon test). Sketch at that size first, scale up.
- Mark must work in monochrome (Voidscreen on Bonelight, Bonelight on Voidscreen).

### Don'ts
- No gradients. No drop shadows. No 3D.
- No literal pet rendering in the logo — that's the product, not the brand. The logo is the *vessel*, the pets are the *content*.
- No anti-aliasing on the pixel edges at logo sizes — the stair-step is the point.
- No more than two colors in the static mark.

---

## 6. One-page summary

| | |
|---|---|
| **Brand in one line** | A virtual pet that eats your workouts. |
| **Personality** | Warm, wry, crafted. |
| **Voice** | Wry, honest, warm — in that order. |
| **Primary color** | Twilight `#4C3A78` |
| **Default background** | Bonelight `#F5F1E8` |
| **Typefaces** | Geist (everything) + Departure Mono (surgical accent) |
| **Logo lead concept** | The mystery egg — pixel silhouette, eight-color speckle (one pixel per elemental line) |
| **Forbidden territory** | Hustle-bro, wellness fluff, tech-bro, kitsch 8-bit |
| **The seam we sit in** | Cute creature × real stakes. Both halves required. |
