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
  D -->|Yes| E[Evolve!]
  D -->|No| F[Keep going]
  E --> F
  F -->|Next day| B
  F -->|Skip days| G[Stats decay]
  G -->|Don't feed| H[Pet weakens]
  H -->|2 days starved| I[Pet passes on]
  G -->|Train again| C
```

You **feed your pet by working out**. Skip too many days and it gets hungry, sad, and tired. Skip even more, and it dies. There is no second pet without releasing the first.

---

## Three starter lines

When you hatch, you pick one of three elemental lines. Each evolves through five stages. The line you pick is permanent for that pet's life.

| Line | Theme | Vibe |
|---|---|---|
| 🔥 **Ember** | Forged in fire | Aggressive, fierce, glow-in-the-dark warmth |
| 💧 **Tide** | Born of the deep | Calm, flowing, the patient one |
| 🌿 **Verdant** | Rooted in earth | Steady, ancient, wild |

There is no "best" line — only the one that looks coolest evolving in your hand. All three follow the same XP curve.

---

## 🔥 Ember evolution

> *Forged in fire.*

```mermaid
graph LR
  E1[Emberling<br/>0 XP] --> E2[Cinderpup<br/>60 XP]
  E2 --> E3[Pyrokit<br/>180 XP]
  E3 --> E4[Infernox<br/>420 XP]
  E4 --> E5[Drakorath<br/>900 XP]
```

| Stage | Name | Form | XP to reach |
|---|---|---|---|
| 1 | **Emberling** | <img src="sprites/ember-1.svg" width="96"> | 0 (starter) |
| 2 | **Cinderpup** | <img src="sprites/ember-2.svg" width="96"> | 60 |
| 3 | **Pyrokit** | <img src="sprites/ember-3.svg" width="96"> | 180 |
| 4 | **Infernox** | <img src="sprites/ember-4.svg" width="96"> | 420 |
| 5 | **Drakorath** | <img src="sprites/ember-5.svg" width="96"> | 900 |

---

## 💧 Tide evolution

> *Born of the deep.*

```mermaid
graph LR
  T1[Dropet<br/>0 XP] --> T2[Bubblin<br/>60 XP]
  T2 --> T3[Tidalkin<br/>180 XP]
  T3 --> T4[Mareclaw<br/>420 XP]
  T4 --> T5[Leviathos<br/>900 XP]
```

| Stage | Name | Form | XP to reach |
|---|---|---|---|
| 1 | **Dropet** | <img src="sprites/tide-1.svg" width="96"> | 0 (starter) |
| 2 | **Bubblin** | <img src="sprites/tide-2.svg" width="96"> | 60 |
| 3 | **Tidalkin** | <img src="sprites/tide-3.svg" width="96"> | 180 |
| 4 | **Mareclaw** | <img src="sprites/tide-4.svg" width="96"> | 420 |
| 5 | **Leviathos** | <img src="sprites/tide-5.svg" width="96"> | 900 |

---

## 🌿 Verdant evolution

> *Rooted in earth.*

```mermaid
graph LR
  V1[Sprout<br/>0 XP] --> V2[Mosswick<br/>60 XP]
  V2 --> V3[Vinepaw<br/>180 XP]
  V3 --> V4[Thornroot<br/>420 XP]
  V4 --> V5[Sylvadrake<br/>900 XP]
```

| Stage | Name | Form | XP to reach |
|---|---|---|---|
| 1 | **Sprout** | <img src="sprites/verdant-1.svg" width="96"> | 0 (starter) |
| 2 | **Mosswick** | <img src="sprites/verdant-2.svg" width="96"> | 60 |
| 3 | **Vinepaw** | <img src="sprites/verdant-3.svg" width="96"> | 180 |
| 4 | **Thornroot** | <img src="sprites/verdant-4.svg" width="96"> | 420 |
| 5 | **Sylvadrake** | <img src="sprites/verdant-5.svg" width="96"> | 900 |

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

---

## Trivia & lore

- Every sprite is drawn from a 16×16 character grid hand-coded into the app — no image files.
- The three colour palettes (Ember, Tide, Verdant) total 24 colours. None of them repeat across lines.
- The starfield background twinkles on a 6-second loop, with stars in white, gold, cyan, and magenta.
- All exercise cues were written to fit on a single line of a phone screen.
- The retro CRT scanlines are a `repeating-linear-gradient` — pure CSS, no images.

---

*Train well. Hatch boldly. May your Drakorath / Leviathos / Sylvadrake roar.*
