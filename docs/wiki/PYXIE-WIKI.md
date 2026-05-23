# 🌟 Pyxie Wiki

A field guide for trainers. Everything you need to keep your pet alive, evolving, and thriving.

> Not sure what Pyxie is? It's a virtual pet that grows stronger every time **you** work out. Pick a starter, train daily, and watch it evolve through five forms.

---

## How it works (the short version)

```mermaid
graph LR
  A[Pick a starter] --> B[Complete a workout]
  B --> C[Pet gains XP +<br/>stats refill]
  C --> D{Cross XP<br/>threshold?}
  D -->|Yes| E[Evolve!<br/>branch chosen by<br/>your habits]
  D -->|No| F[Keep going]
  E --> F
  F -->|Next day| B
  F -->|Skip days| G[Stats decay]
  G -->|Don't feed| H[Pet weakens]
  H -->|2 days starved| I[Pet passes on]
  G -->|Train again| C
```

You **feed your pet by working out**. Skip too many days and it gets hungry, sad, and tired. Skip even more, and it dies. There is no second pet without releasing the first.

Every evolution is a **fork in the road**. Which of two children you get depends on the workouts you've actually done — not a setting, not a roll of the dice. Stick to easy walks and you'll meet one creature; chase burpees and you'll meet a different one. See the [branching rules](#how-evolution-branches) below.

---

## Eight starter lines

When your egg hatches, the game rolls one of eight elemental lines for you — blind-box, independent of egg color. Each evolves through five stages. The line your pet receives is permanent for that pet's life.

| Line | Theme | Vibe |
|---|---|---|
| 🔥 **Ember** | Forged in fire | Aggressive, fierce, glow-in-the-dark warmth |
| 💧 **Tide** | Born of the deep | Calm, flowing, the patient one |
| 🌿 **Verdant** | Rooted in earth | Steady, ancient, wild |
| 🌬️ **Gale** | Carried on the wind | Mobile, quick, sky-bound |
| 🪨 **Stone** | Patient and unbroken | Heavy, mineral, isometric |
| 🌑 **Umbra** | Shaped in shadow | Cool dusk palette, night-training feel |
| ✨ **Aurora** | Lit from within | Pastel and gentle, recovery-coded |
| ⚡ **Static** | Charged and restless | Electric yellows, high-frequency intervals |

There is no "best" line — only the one that looks coolest evolving in your hand. All eight follow the same XP curve. The full roster spans **248 nodes** (31 per line) across 5 stages, with each pet getting a unique hue tint at hatch so no two are visually identical.

---

## How evolution branches

Every time your pet hits an XP threshold, the game checks your **workout history** and picks one of two children for the next stage. The axis flips at each step:

```mermaid
graph TD
  S0[Stage 0 · Baseline] -->|easy+medium dominant| S1P[Stage 1 · Primary]
  S0 -->|hard dominant| S1A[Stage 1 · Alt]
  S1P -->|beginner dominant| S2PP[Stage 2 · PP]
  S1P -->|intermediate+advanced dominant| S2PA[Stage 2 · PA]
  S1A -->|beginner dominant| S2AP[Stage 2 · AP]
  S1A -->|intermediate+advanced dominant| S2AA[Stage 2 · AA]
  S2PP -->|intensity again| S3[Stage 3 · 8 forms]
  S2PA -->|intensity again| S3
  S2AP -->|intensity again| S3
  S2AA -->|intensity again| S3
  S3 -->|complexity again| S4[Stage 4 · 16 finals]
```

| Stage transition | Axis | Primary side | Alt side |
|---|---|---|---|
| 0 → 1 | **Intensity** | easy + medium | hard |
| 1 → 2 | **Complexity** | beginner | intermediate + advanced |
| 2 → 3 | **Intensity** | easy + medium | hard |
| 3 → 4 | **Complexity** | beginner | intermediate + advanced |

Ties favour the primary side, so a pet trained on pure defaults walks down the canonical spine. Mix it up to see the rarer forms.

> **A path is its name.** Forms are labelled by the choices it took to get there. `ember-pap` = Ember → primary → alt → primary. The path is permanent for that pet; release it from the settings tab if you want a different lineage.

---

## 🔥 Ember evolution tree

> *Forged in fire.*

Sixteen named forms across five stages. The spine (all-primary) leads to **Drakorath**. Cranking workouts harder or more complex peels off into the alt branches.

```mermaid
graph LR
  E0[Emberling] -->|p| E1P[Cinderpup]
  E0 -->|a| E1A[Sparkit]
  E1P -->|p| E2PP[Pyrokit]
  E1P -->|a| E2PA[Blazewig]
  E1A -->|p| E2AP[Volcanid]
  E1A -->|a| E2AA[Smolderling]
  E2PP --> E3PPP[Infernox]
  E2PP --> E3PPA[Vulkaron]
  E2PA --> E3PAP[Cindarro]
  E2PA --> E3PAA[Soothspark]
  E2AP --> E3APP[Magmir]
  E2AP --> E3APA[Pyrebrand]
  E2AA --> E3AAP[Coalfin]
  E2AA --> E3AAA[Charwyrm]
  E3PPP --> E4[Drakorath<br/>+ 15 hidden finals]
```

### Stage 0 — baseline
| Form | Path | Sprite |
|---|---|---|
| **Emberling** | `ember` | <img src="sprites/ember.svg" width="80"> |

### Stage 1 — split on intensity (60 XP)
| Form | Path | Sprite |
|---|---|---|
| **Cinderpup** | `ember-p` (easy+medium) | <img src="sprites/ember-p.svg" width="80"> |
| **Sparkit** | `ember-a` (hard) | <img src="sprites/ember-a.svg" width="80"> |

### Stage 2 — split on complexity (180 XP)
| Form | Path | Sprite |
|---|---|---|
| **Pyrokit** | `ember-pp` | <img src="sprites/ember-pp.svg" width="80"> |
| **Blazewig** | `ember-pa` | <img src="sprites/ember-pa.svg" width="80"> |
| **Volcanid** | `ember-ap` | <img src="sprites/ember-ap.svg" width="80"> |
| **Smolderling** | `ember-aa` | <img src="sprites/ember-aa.svg" width="80"> |

### Stage 3 — split on intensity (420 XP)
| Form | Path | Sprite |
|---|---|---|
| **Infernox** | `ember-ppp` | <img src="sprites/ember-ppp.svg" width="80"> |
| **Vulkaron** | `ember-ppa` | <img src="sprites/ember-ppa.svg" width="80"> |
| **Cindarro** | `ember-pap` | <img src="sprites/ember-pap.svg" width="80"> |
| **Soothspark** | `ember-paa` | <img src="sprites/ember-paa.svg" width="80"> |
| **Magmir** | `ember-app` | <img src="sprites/ember-app.svg" width="80"> |
| **Pyrebrand** | `ember-apa` | <img src="sprites/ember-apa.svg" width="80"> |
| **Coalfin** | `ember-aap` | <img src="sprites/ember-aap.svg" width="80"> |
| **Charwyrm** | `ember-aaa` | <img src="sprites/ember-aaa.svg" width="80"> |

### Stage 4 — split on complexity (900 XP)
| Form | Path | Sprite |
|---|---|---|
| **Drakorath** | `ember-pppp` | <img src="sprites/ember-pppp.svg" width="80"> |

> Fifteen further stage-4 finals (`ember-pppa`, `ember-ppap`, … `ember-aaaa`) exist in the tree but are unnamed and render as procedural placeholders. They unlock for players who diverge from the all-primary spine at the final fork.

---

## 💧 Tide evolution tree

> *Born of the deep.*

The water line. Calm starters branch into either patient currents or stormy abyssal forms. Spine ends at **Leviathos**.

```mermaid
graph LR
  T0[Dropet] -->|p| T1P[Bubblin]
  T0 -->|a| T1A[Coralune]
  T1P -->|p| T2PP[Tidalkin]
  T1P -->|a| T2PA[Brinewhip]
  T1A -->|p| T2AP[Reefling]
  T1A -->|a| T2AA[Saltspire]
  T2PP --> T3PPP[Mareclaw]
  T2PP --> T3PPA[Abyssal]
  T2PA --> T3PAP[Streamblade]
  T2PA --> T3PAA[Mistral]
  T2AP --> T3APP[Currentide]
  T2AP --> T3APA[Pelagith]
  T2AA --> T3AAP[Surfsong]
  T2AA --> T3AAA[Maelstrix]
  T3PPP --> T4[Leviathos<br/>+ 15 hidden finals]
```

### Stage 0 — baseline
| Form | Path | Sprite |
|---|---|---|
| **Dropet** | `tide` | <img src="sprites/tide.svg" width="80"> |

### Stage 1 — split on intensity
| Form | Path | Sprite |
|---|---|---|
| **Bubblin** | `tide-p` | <img src="sprites/tide-p.svg" width="80"> |
| **Coralune** | `tide-a` | <img src="sprites/tide-a.svg" width="80"> |

### Stage 2 — split on complexity
| Form | Path | Sprite |
|---|---|---|
| **Tidalkin** | `tide-pp` | <img src="sprites/tide-pp.svg" width="80"> |
| **Brinewhip** | `tide-pa` | <img src="sprites/tide-pa.svg" width="80"> |
| **Reefling** | `tide-ap` | <img src="sprites/tide-ap.svg" width="80"> |
| **Saltspire** | `tide-aa` | <img src="sprites/tide-aa.svg" width="80"> |

### Stage 3 — split on intensity
| Form | Path | Sprite |
|---|---|---|
| **Mareclaw** | `tide-ppp` | <img src="sprites/tide-ppp.svg" width="80"> |
| **Abyssal** | `tide-ppa` | <img src="sprites/tide-ppa.svg" width="80"> |
| **Streamblade** | `tide-pap` | <img src="sprites/tide-pap.svg" width="80"> |
| **Mistral** | `tide-paa` | <img src="sprites/tide-paa.svg" width="80"> |
| **Currentide** | `tide-app` | <img src="sprites/tide-app.svg" width="80"> |
| **Pelagith** | `tide-apa` | <img src="sprites/tide-apa.svg" width="80"> |
| **Surfsong** | `tide-aap` | <img src="sprites/tide-aap.svg" width="80"> |
| **Maelstrix** | `tide-aaa` | <img src="sprites/tide-aaa.svg" width="80"> |

### Stage 4 — split on complexity
| Form | Path | Sprite |
|---|---|---|
| **Leviathos** | `tide-pppp` | <img src="sprites/tide-pppp.svg" width="80"> |

---

## 🌿 Verdant evolution tree

> *Rooted in earth.*

The plant line. Patient growers settle into mossy steadiness; aggressive trainers grow thorns. Spine ends at **Sylvadrake**.

```mermaid
graph LR
  V0[Sprout] -->|p| V1P[Mosswick]
  V0 -->|a| V1A[Mycel]
  V1P -->|p| V2PP[Vinepaw]
  V1P -->|a| V2PA[Briarcub]
  V1A -->|p| V2AP[Spireleaf]
  V1A -->|a| V2AA[Sporebound]
  V2PP --> V3PPP[Thornroot]
  V2PP --> V3PPA[Bramblefen]
  V2PA --> V3PAP[Petalblade]
  V2PA --> V3PAA[Bloomhart]
  V2AP --> V3APP[Loamspike]
  V2AP --> V3APA[Sapwing]
  V2AA --> V3AAP[Mossfang]
  V2AA --> V3AAA[Cordycept]
  V3PPP --> V4[Sylvadrake<br/>+ 15 hidden finals]
```

### Stage 0 — baseline
| Form | Path | Sprite |
|---|---|---|
| **Sprout** | `verdant` | <img src="sprites/verdant.svg" width="80"> |

### Stage 1 — split on intensity
| Form | Path | Sprite |
|---|---|---|
| **Mosswick** | `verdant-p` | <img src="sprites/verdant-p.svg" width="80"> |
| **Mycel** | `verdant-a` | <img src="sprites/verdant-a.svg" width="80"> |

### Stage 2 — split on complexity
| Form | Path | Sprite |
|---|---|---|
| **Vinepaw** | `verdant-pp` | <img src="sprites/verdant-pp.svg" width="80"> |
| **Briarcub** | `verdant-pa` | <img src="sprites/verdant-pa.svg" width="80"> |
| **Spireleaf** | `verdant-ap` | <img src="sprites/verdant-ap.svg" width="80"> |
| **Sporebound** | `verdant-aa` | <img src="sprites/verdant-aa.svg" width="80"> |

### Stage 3 — split on intensity
| Form | Path | Sprite |
|---|---|---|
| **Thornroot** | `verdant-ppp` | <img src="sprites/verdant-ppp.svg" width="80"> |
| **Bramblefen** | `verdant-ppa` | <img src="sprites/verdant-ppa.svg" width="80"> |
| **Petalblade** | `verdant-pap` | <img src="sprites/verdant-pap.svg" width="80"> |
| **Bloomhart** | `verdant-paa` | <img src="sprites/verdant-paa.svg" width="80"> |
| **Loamspike** | `verdant-app` | <img src="sprites/verdant-app.svg" width="80"> |
| **Sapwing** | `verdant-apa` | <img src="sprites/verdant-apa.svg" width="80"> |
| **Mossfang** | `verdant-aap` | <img src="sprites/verdant-aap.svg" width="80"> |
| **Cordycept** | `verdant-aaa` | <img src="sprites/verdant-aaa.svg" width="80"> |

### Stage 4 — split on complexity
| Form | Path | Sprite |
|---|---|---|
| **Sylvadrake** | `verdant-pppp` | <img src="sprites/verdant-pppp.svg" width="80"> |

---

## 🌬️ Gale evolution tree

> *Carried on the wind.*

Phase-3 baseline (ADR-0004). The wind line trades grounded power for mobility — fluid silhouettes, storm-grey palette. Spine ends at **Tempestar**.

```mermaid
graph LR
  G0[Wisplet] -->|p| G1P[Zephyrling]
  G0 -->|a| G1A[Gustcub]
  G1P --> G2[…stages 2-3…]
  G1A --> G2
  G2 --> G4[Tempestar<br/>+ 15 hidden finals]
```

| Stage | Spine form | Alt-1 form | Sprite (spine) |
|---|---|---|---|
| 0 | **Wisplet** (`gale`) | — | <img src="sprites/gale.svg" width="80"> |
| 1 | **Zephyrling** (`gale-p`) | **Gustcub** (`gale-a`) | <img src="sprites/gale-p.svg" width="80"> |
| 2 | **Galekit** (`gale-pp`) | Skydancer, Squallhound, Boltwing | <img src="sprites/gale-pp.svg" width="80"> |
| 3 | **Cyclonix** (`gale-ppp`) | 7 alt forms (Stormvane … Stormwyrm) | <img src="sprites/gale-ppp.svg" width="80"> |
| 4 | **Tempestar** (`gale-pppp`) | 15 unauthored leaves (incl. Skyrax chaos-leaf) | <img src="sprites/gale-pppp.svg" width="80"> |

> Spine grids ship now; the 21 alt-branch grids per stage backfill in follow-up commissions per ADR-0004 rollout cadence. Unauthored nodes render via procedural placeholder with a `?` badge.

---

## 🪨 Stone evolution tree

> *Patient and unbroken.*

Phase-3 baseline (ADR-0004). The earth line rewards isometric, low-and-slow work — heavy silhouettes, warm-earth palette. Spine ends at **Megalith**.

```mermaid
graph LR
  S0[Pebbling] -->|p| S1P[Cobbleton]
  S0 -->|a| S1A[Shaleling]
  S1P --> S2[…stages 2-3…]
  S1A --> S2
  S2 --> S4[Megalith<br/>+ 15 hidden finals]
```

| Stage | Spine form | Alt-1 form | Sprite (spine) |
|---|---|---|---|
| 0 | **Pebbling** (`stone`) | — | <img src="sprites/stone.svg" width="80"> |
| 1 | **Cobbleton** (`stone-p`) | **Shaleling** (`stone-a`) | <img src="sprites/stone-p.svg" width="80"> |
| 2 | **Granicub** (`stone-pp`) | Cobblerend, Granibrand, Shaledrake | <img src="sprites/stone-pp.svg" width="80"> |
| 3 | **Boulderth** (`stone-ppp`) | 7 alt forms (Bouldervane … Obsiwyrm) | <img src="sprites/stone-ppp.svg" width="80"> |
| 4 | **Megalith** (`stone-pppp`) | 15 unauthored leaves (incl. Stonerax chaos-leaf) | <img src="sprites/stone-pppp.svg" width="80"> |

> Same rollout pattern as Gale — spine first, alt-branch art on follow-up PRs.

---

## How many workouts to reach final form?

If you're doing **medium intensity / beginner complexity** (22 XP per workout) the path looks like this:

| Goal | Workouts |
|---|---|
| Stage 2 (first evolution) | 3 |
| Stage 3 | 9 |
| Stage 4 | 20 |
| Stage 5 (final form) | **41** |

Crank intensity or complexity up to shorten the road. Maxing out (**hard / advanced**, 57 XP per workout) gets you to final form in **16 workouts**.

---

## The three stats

Your pet has three needs that decay around the clock — whether the app is open or not.

| Stat | What it tracks | Decay rate | Time to zero |
|---|---|---|---|
| 🍖 **Hunger** | Filled by working out | -1.6 / hour | ~62 hours |
| 💖 **Happiness** | Tap your pet, work out | -1.2 / hour | ~83 hours |
| ⚡ **Energy** | Workouts also refill this | -1.0 / hour | ~100 hours |

A completed workout refills hunger by **+28**, happiness by **+22**, energy by **+18** — enough to bring all three back to full from medium-low.

If **all three** stats reach 0 at the same time, your pet enters **critical condition**. If you don't train within **48 hours** from that point, your pet dies.

A skipped day costs you your streak — but not your pet. The pet only dies from prolonged neglect, not from a missed Saturday.

---

## Workout settings

Two dials shape every session: **intensity** (how hard) and **complexity** (how skilled).

### Intensity

| Setting | XP base | Examples |
|---|---|---|
| **Easy** | 12 | Wall push-ups, glute bridges, calf raises |
| **Medium** | 22 | Push-ups, lunges, mountain climbers |
| **Hard** | 38 | Burpees, jump squats, plyo push-ups |

### Complexity multiplier

| Setting | Multiplier | Best for |
|---|---|---|
| **Beginner** | × 1.0 | Brand new or returning from a break |
| **Intermediate** | × 1.25 | Comfortable with form, want a challenge |
| **Advanced** | × 1.5 | Have a real strength base |

XP per workout = base × multiplier. So Easy/Beginner = 12 XP, Hard/Advanced = 57 XP.

### Session shape

Every workout follows the same format. **9 minutes 45 seconds** total:

```mermaid
graph LR
  W[Warm up<br/>60s] --> E1[Exercise 1<br/>45s]
  E1 --> R1[Rest 15s]
  R1 --> EN[... 8 exercises total ...]
  EN --> EL[Exercise 8<br/>45s]
  EL --> C[Cool down<br/>60s]
```

Exercises are randomly drawn from the catalogue below for your chosen difficulty bucket. Hit **Shuffle** in the workout view to re-roll the list before you start.

---

## 📋 Full exercise catalogue

Every exercise lives in one of nine buckets — three intensities × three complexities.

### 🟢 Easy

<details><summary><b>Easy · Beginner</b> — the gentlest 12 XP route in the game</summary>

| # | Exercise | Cue |
|---|---|---|
| 1 | Wall Push-ups | Stand arm-length from a wall. Lean in, press out. |
| 2 | Bodyweight Squats | Feet shoulder-width. Sit back, chest tall. |
| 3 | Glute Bridges | On your back, lift hips, squeeze glutes at the top. |
| 4 | Standing March | Lift knees high, alternating sides. |
| 5 | Arm Circles | Arms out, small circles forward then backward. |
| 6 | Cat-Cow | On hands & knees, arch and round your spine. |
| 7 | Calf Raises | Rise onto toes, lower slow. |
| 8 | Standing Side Bends | Reach overhead, lean side to side. |
| 9 | Seated Leg Extensions | Sit tall, straighten one leg, switch. |
| 10 | Wall Sit | Back to wall, slide down to a comfortable angle. |

</details>

<details><summary><b>Easy · Intermediate</b></summary>

| # | Exercise | Cue |
|---|---|---|
| 1 | Incline Push-ups | Hands on a chair or counter. Lower chest to it. |
| 2 | Reverse Lunges | Step back, drop the back knee, drive up. |
| 3 | Bird Dogs | Opposite arm and leg extended, stay steady. |
| 4 | Dead Bug | Back flat, opposite arm/leg lower slowly. |
| 5 | Step-ups | Use a sturdy step. Drive through the heel. |
| 6 | Side-lying Leg Raises | Lift top leg, control down. |
| 7 | Standing Knee-to-Elbow | Crunch knee up, elbow down. |
| 8 | Plank Knee Drops | High plank, tap knees down lightly. |
| 9 | Glute Bridge March | Hips up, lift one foot at a time. |
| 10 | Sumo Squat | Wide stance, toes out, sit straight down. |

</details>

<details><summary><b>Easy · Advanced</b></summary>

| # | Exercise | Cue |
|---|---|---|
| 1 | Tempo Squats (3s down) | Slow descent, controlled rise. |
| 2 | Hand Release Push-ups | Chest to floor, lift hands, press up. |
| 3 | Single-Leg Glute Bridge | One leg straight up, drive other heel. |
| 4 | Curtsy Lunges | Step back diagonally, sink low. |
| 5 | Plank Shoulder Taps | High plank, tap opposite shoulder. |
| 6 | Hollow Body Hold | Low back pressed to floor, arms & legs lifted. |
| 7 | Side Plank | Stack feet, hip high, breathe. |
| 8 | Reverse Snow Angels | Lie face down, sweep arms hip to overhead. |
| 9 | Standing Knee Drives | Drive knees up explosively but controlled. |
| 10 | Wall Sit + Calf Raise | Hold the sit, pulse onto toes. |

</details>

### 🟡 Medium

<details><summary><b>Medium · Beginner</b> — the default loadout</summary>

| # | Exercise | Cue |
|---|---|---|
| 1 | Push-ups | Drop to knees if needed. Chest leads. |
| 2 | Walking Lunges | Step forward, drop back knee, alternate. |
| 3 | Mountain Climbers | High plank, drive knees in. |
| 4 | Jumping Jacks | Arms and legs in rhythm. |
| 5 | Plank Hold | Hips level, breathe steady. |
| 6 | Bicycle Crunches | Elbow to opposite knee, slow & controlled. |
| 7 | Squat Hold Pulses | Drop to a squat, pulse small. |
| 8 | Russian Twists | Heels up if you can. Tap side to side. |
| 9 | High Knees | Quick steps, knees to hip height. |
| 10 | Push-up Shoulder Tap | Push-up, tap one shoulder, alternate. |

</details>

<details><summary><b>Medium · Intermediate</b></summary>

| # | Exercise | Cue |
|---|---|---|
| 1 | Squat-to-Stand Tempo | 3 seconds down, 1 up. |
| 2 | Tricep Dips (Chair) | Hands on chair edge, dip and press. |
| 3 | Reverse Crunches | Knees up, lift hips toward ribs. |
| 4 | Side Lunges | Step wide, sit one leg, switch. |
| 5 | Spider Plank | Plank, drive knee to same-side elbow. |
| 6 | Lateral Hops | Hop side to side over a line. |
| 7 | Single-Leg Hip Hinge | Hinge forward, back leg straight. |
| 8 | V-ups | Reach hands to toes, slow lower. |
| 9 | Plank to Down-dog | Flow from plank to inverted V. |
| 10 | Reverse Lunge + Knee Drive | Step back, drive front knee up. |

</details>

<details><summary><b>Medium · Advanced</b></summary>

| # | Exercise | Cue |
|---|---|---|
| 1 | Decline Push-ups | Feet on a step. Chest leads down. |
| 2 | Bulgarian Split Squat | Back foot elevated. Slow descent. |
| 3 | Pike Push-ups | Hips high, lower head between hands. |
| 4 | Toe Touches | Lie on back, lift legs, reach. |
| 5 | Plank to Push-up | Forearm plank to high plank and back. |
| 6 | Cossack Squats | Wide stance, shift to one side, switch. |
| 7 | Hollow Body Rocks | Stay hollow, rock heels to head. |
| 8 | Archer Push-ups | Shift weight side to side. |
| 9 | Single-Leg Deadlift (no weight) | Hinge forward, back leg up. |
| 10 | Side Plank Hip Dips | Lower hip, lift back up. |

</details>

### 🔴 Hard

<details><summary><b>Hard · Beginner</b> — explosive but accessible</summary>

| # | Exercise | Cue |
|---|---|---|
| 1 | Burpees | Drop, plank, hop in, jump up. |
| 2 | Jump Squats | Squat down, explode up. |
| 3 | Push-up Burpee | Burpee + a push-up at the bottom. |
| 4 | Plank Jacks | High plank, hop feet wide and back. |
| 5 | Tuck Jumps | Jump up, knees to chest. |
| 6 | Squat Thrusts | Hands down, kick legs out and in. |
| 7 | Plank Up-Downs | Down to forearms, back to hands. |
| 8 | Sprawls | Drop to plank quickly, jump back up. |
| 9 | Side-to-Side Skaters | Lateral bound, touch the floor. |
| 10 | Mountain Climber Sprints | Fast knees, controlled plank. |

</details>

<details><summary><b>Hard · Intermediate</b></summary>

| # | Exercise | Cue |
|---|---|---|
| 1 | Plyometric Lunges | Switch legs midair each rep. |
| 2 | Diamond Push-ups | Hands form a diamond. Triceps fire. |
| 3 | Pistol Squat Progression | One-legged squat to a chair. |
| 4 | Hollow Body Hold | Lower back pressed. Hold tight. |
| 5 | Burpee Tuck Jump | Burpee, but finish with a tuck jump. |
| 6 | Hand-Release Push-ups | Full chest down each rep. |
| 7 | Plank to Pike | Plank, hike hips up to pike, return. |
| 8 | Bear Crawl | Knees off the floor, crawl in place. |
| 9 | Single-Leg Burpee | Burpee, only one foot touches. |
| 10 | Crab Toe Touch | Crab pose, kick foot up to opposite hand. |

</details>

<details><summary><b>Hard · Advanced</b> — full 57 XP per workout</summary>

| # | Exercise | Cue |
|---|---|---|
| 1 | Pseudo Planche Push-up | Hands at hips, lean forward, press. |
| 2 | Pistol Squats (assisted ok) | Hold a doorframe if needed. |
| 3 | Handstand Wall Hold | Chest to wall, brace core. |
| 4 | Plyo Push-ups | Explode off the floor each rep. |
| 5 | Dragon Flag Negatives | Lower slow under control. |
| 6 | Shrimp Squat Progression | One-leg squat holding back foot. |
| 7 | L-sit (knees ok) | Hands on the floor, lift hips. |
| 8 | Burpee Broad Jump | Burpee, then jump forward. |
| 9 | Archer Push-up Full | Shift hard side to side. |
| 10 | V-up Burpee | Burpee, on the way down do a V-up. |

</details>

---

## Tips for trainers

- **Streaks aren't punishment.** Missing a day resets your streak counter but does no permanent harm. Just train tomorrow.
- **Death is rare but real.** Two full days with all three stats at zero ends the pet. To get there you'd need to skip ~4 days entirely.
- **Tap the pet.** It's not just decoration — tapping refills happiness a little.
- **Pick a difficulty you'll actually do.** A daily Easy/Beginner workout beats a once-a-week Hard/Advanced one. Drakorath comes faster from consistency.
- **The settings tab has a "Start over" button.** It releases your current pet and lets you hatch a new one in a different line. There's no undo.
- **Browser alarms only fire while the tab is open.** Set a phone alarm too if you want a real morning nudge.
- **Mix workouts to see new creatures.** Sticking to defaults always lands on the spine (Drakorath / Leviathos / Sylvadrake). The 15 alt-branch forms per line only appear if you push intensity or complexity at the right stages. Plan your route from the [evolution tree](#how-evolution-branches) above.

---

## Trivia & lore

- Every sprite is drawn from a 16×16 character grid hand-coded into the app — no image files.
- The three colour palettes (Ember, Tide, Verdant) total 24 colours. None of them repeat across lines.
- The full evolution tree contains **93 nodes** (31 per line). Only 48 are hand-named; the remaining 45 stage-4 finals exist as procedural placeholders waiting for art.
- The starfield background twinkles on a 6-second loop, with stars in white, gold, cyan, and magenta.
- All exercise cues were written to fit on a single line of a phone screen.
- The retro CRT scanlines are a `repeating-linear-gradient` — pure CSS, no images.

---

*Train well. Hatch boldly. May your Drakorath / Leviathos / Sylvadrake roar.*
