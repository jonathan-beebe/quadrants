# Color Research: Emotion-Matched Quadrant Palettes

Default gradient colors for every framework whose quadrant labels name an
emotional state — the whole Mental Health category plus How–Now–Wow, Passion ×
Proficiency, Worry Matrix, and Love/Loathe/Learn/Leave — are derived from
color–emotion research rather than assigned for contrast alone. The color sets
live in [`src/templates.ts`](../src/templates.ts) with a one-line rationale
comment beside each; the preset palette lives in
[`src/colors.ts`](../src/colors.ts).

## Research basis

- **Cross-cultural color–emotion associations.** Jonauskaite, Mohr et al.
  surveyed 4,598 participants across 30 nations and found highly consistent
  links: red ↔ anger _and_ love (intense emotion of either valence), yellow ↔
  joy and amusement, pink ↔ love/pleasure, gray ↔ sadness/boredom/fatigue, black
  and dark tones ↔ fear and sadness. Purple was the one hue with ambivalent,
  mixed associations across cultures.
  ([Psychological Science, 2020](https://journals.sagepub.com/doi/10.1177/0956797620948810))
- **Stability over time.** A 128-year systematic review (2025) confirms these
  correspondences are stable across decades and cultures, and that light,
  saturated colors track positive emotion while dark, desaturated colors track
  negative emotion. ([PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC12325498/))
- **Terms vs. patches.** The associations hold whether colors are shown as
  swatches or named as words, so they transfer to UI gradients.
  ([i-Perception, 2020](https://journals.sagepub.com/doi/10.1177/2041669520902484))
- **Calming-color physiology.** Blue and green exposure measurably reduces
  stress response (lower cortisol, parasympathetic activation, increased alpha
  activity): blue reads as relief and relaxation, green as contentment and
  restoration.
  ([CogniFit overview](https://blog.cognifit.com/colors-that-calm-the-mind-what-psychology-and-cognitive-science-reveal/))
- **Depletion is gray.** Gray and desaturated tones are consistently linked to
  exhaustion, emotional flatness, and burnout — hence a warm ash "Stone" for
  burned-out and languishing states, distinct from the cooler neutral Slate used
  for indifference and futility.
  ([NeuroLaunch](https://neurolaunch.com/what-color-represents-stress/))

## Canonical schemes honored

Where a framework's source literature defines its own colors, canon wins over
generic association:

- **RULER Mood Meter** — red = Tense, yellow = Excited, blue = Down, green =
  Calm.
- **Zones of Regulation** — the zones _are_ colors: Blue, Green, Yellow, Red.
  True yellow, not amber.
- **How–Now–Wow (COCD box)** — blue = feasible/ordinary ("Now"), with Wow given
  joy-yellow per the emotion research.

## Emotion → hue vocabulary

Presets added for this work are marked with \*. All values are Tailwind
400-level hues, keeping gradient corners in one saturation/lightness band.

| Emotion cluster                        | Hue      | Hex       |
| -------------------------------------- | -------- | --------- |
| Joy, surprise, exhilaration            | Yellow\* | `#facc15` |
| Eager anticipation, optimism           | Amber    | `#fbbf24` |
| Anxious activation, stressed drive     | Orange   | `#f97316` |
| Anger, alarm, acute distress, loathing | Red      | `#ef4444` |
| Love, tenderness                       | Pink     | `#f472b6` |
| Fear, ambivalence, imagination         | Violet   | `#a78bfa` |
| Sadness, withdrawn "down" states       | Indigo\* | `#818cf8` |
| Relief, relaxation, calm confidence    | Blue     | `#60a5fa` |
| Serenity, acceptance, restoration      | Teal\*   | `#2dd4bf` |
| Contentment, flow, security, growth    | Green    | `#4ade80` |
| Flatness, indifference, futility       | Slate    | `#94a3b8` |
| Burnout, languishing, ashen depletion  | Stone\*  | `#a8a29e` |

## Notes on specific calls

- **Survival (Energy Quadrants)** is fight-or-flight red, not orange — it is an
  alarm state, and red is the cross-cultural alarm/anger hue.
- **Burnout (Energy Quadrants, Passion × Proficiency)** is ash-stone: the
  research ties depletion to desaturated warm grays, not to any saturated hue.
- **Tense-Tiredness (Thayer)** — Thayer's worst-mood state (anxious _and_
  exhausted) gets weary slate rather than red; red implies energy it lacks.
- **Down / Depression / Get Away From** use indigo (sad withdrawal) or slate
  (flat depression) rather than cheerful sky-blue — "feeling blue" is a darker,
  more muted blue than the relaxation blue.
- **Conflicted (Positive × Negative Affect)** keeps violet deliberately: purple
  is the one hue the 30-nation study found genuinely ambivalent.
- **Worry Matrix** is an intentionally all-cool set (teal/green/blue/slate) — it
  is an anxiety-management tool, so the whole gradient should read calming.
