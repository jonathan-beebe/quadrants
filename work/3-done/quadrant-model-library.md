# Research: A Library of Quadrant Models

**Date:** 2026-06-10 **Goal:** Identify well-known 2×2 / x-y tension models
worth shipping as default quadrant spaces, capture _why_ each one works, and
define defaults (name, axis labels, quadrant labels, colors) complete enough
that a user can scan the library, pick one, and start placing items immediately.

---

## How this maps to our data model

Everything below is expressed in the shape of `FrameworkTemplate`
(`src/types.ts`), ready to paste into `src/templates.ts`:

- `quadrants` order is `[top-left, top-right, bottom-left, bottom-right]`.
- Convention used throughout: **right = more of X, up = more of Y** (matches the
  shipped Eisenhower preset). Where a canonical model breaks this (BCG inverts
  its x-axis), I normalized to our convention and noted it.
- Intensity axes get a bare noun (`'Urgency'`); bipolar axes use the existing
  `'A / B'` style (`'Existing / New'`), reading left → right / bottom → top.
- All colors are drawn from the existing `colorPresets` palette in
  `src/colors.ts` — so every default stays editable from the ColorPicker without
  orphaned swatches, and the corner gradient stays in-family.

**Accessibility note (WCAG 1.4.1, Use of Color):** quadrant colors render as 8%
tints + the background gradient, and meaning is always carried by the text
labels — color is reinforcement, never the sole signal. That said, palettes
below avoid pairing red/green as the _only_ differentiator on any axis, and
"go/stop" semantics (green = act, red = caution, slate = deprioritize) are kept
consistent across the library so learned meaning transfers between models.

---

## The library at a glance

| #   | Model                     | Tension (X × Y)                  | Domain          | Tier               |
| --- | ------------------------- | -------------------------------- | --------------- | ------------------ |
| 1   | Eisenhower Matrix †       | Urgency × Importance             | Productivity    | Core (ships today) |
| 2   | Impact / Effort           | Effort × Impact                  | Prioritization  | Core               |
| 3   | One-Way / Two-Way Doors   | Consequence × Reversibility      | Decisions       | Core               |
| 4   | Risk Matrix               | Likelihood × Impact              | Risk            | Core               |
| 5   | Growth–Share (BCG)        | Market share × Market growth     | Strategy        | Core               |
| 6   | Ansoff Matrix             | Product novelty × Market novelty | Strategy        | Extended           |
| 7   | Vision × Execution        | Vision × Ability to execute      | Strategy        | Extended           |
| 8   | Power × Interest          | Interest × Power                 | Stakeholders    | Core               |
| 9   | Knowns & Unknowns         | Knowledge × Awareness            | Risk / learning | Extended           |
| 10  | Certainty × Agreement     | Certainty × Agreement            | Complexity      | Extended           |
| 11  | Skill × Will              | Skill × Will                     | Coaching        | Core               |
| 12  | Johari Window             | Known to self × Known to others  | Self-awareness  | Extended           |
| 13  | Competence Ladder         | Competence × Awareness           | Learning        | Extended           |
| 14  | Passion × Proficiency     | Good at it × Love it             | Career          | Core               |
| 15  | Mood Meter                | Pleasantness × Energy            | Emotions        | Core               |
| 16  | Importance × Satisfaction | Satisfaction × Importance        | Product / UX    | Extended           |
| 17  | Worry Matrix              | Control × Importance             | Wellbeing       | Extended           |
| 18  | How–Now–Wow               | Originality × Ease               | Ideation        | Extended           |

† Already shipped; recommendation is to add colors (see retrofits at the end).

**Tier meaning:** _Core_ = broad audience, instantly understood, strong color
story — ship first (9 models). _Extended_ = valuable but narrower; good
follow-up batch.

---

## 1. Eisenhower Matrix — _Urgency × Importance_

**Why it works.** The foundational insight is that urgency and importance are
independent dimensions that feel like one. Urgent-but-unimportant work
masquerades as important, and important-but-not-urgent work (the top-left
quadrant) is where long-term value lives — and where people chronically
under-invest. The gradient space matters here: an item drifting rightward is a
"Schedule" item becoming a crisis.

**Origin.** Attributed to Dwight D. Eisenhower ("What is important is seldom
urgent and what is urgent is seldom important," 1954); popularized by Stephen
Covey in _The 7 Habits of Highly Effective People_ (1989). Also known as the 4
Ds: Do, Decide, Delegate, Delete.

```typescript
{
  name: 'Eisenhower Matrix',
  axisX: 'Urgency',
  axisY: 'Importance',
  quadrants: ['Schedule', 'Do First', 'Eliminate', 'Delegate'],
  colors: ['#60a5fa', '#4ade80', '#94a3b8', '#fbbf24'],
  // Schedule = blue (calm, planned) · Do First = green (go) ·
  // Eliminate = slate (fade out) · Delegate = amber (hand-off, caution)
}
```

## 2. Impact / Effort — _Effort × Impact_

**Why it works.** Separates _value_ from _cost_, the two things humans conflate
when choosing what to do next (we gravitate to easy, not valuable). Top-left
("Quick Wins") is the famous payoff quadrant; bottom-right ("Thankless Tasks")
is the trap. Probably the single most-used 2×2 in product and team settings.

**Origin.** Known as the Action Priority Matrix; closely related to the PICK
chart (Possible, Implement, Challenge, Kill) from Lockheed Martin's lean/Six
Sigma practice.

```typescript
{
  name: 'Impact / Effort',
  axisX: 'Effort',
  axisY: 'Impact',
  quadrants: ['Quick Wins', 'Big Bets', 'Fill-Ins', 'Thankless Tasks'],
  colors: ['#4ade80', '#60a5fa', '#fbbf24', '#94a3b8'],
  // Quick Wins = green (do now) · Big Bets = blue (invest deliberately) ·
  // Fill-Ins = amber (maybe) · Thankless = slate (avoid)
}
```

## 3. One-Way / Two-Way Doors — _Consequence × Reversibility_

**Why it works.** Most decision anxiety comes from treating every choice as
high-stakes. This model says decision _process_ should scale with two factors:
can you undo it, and how much does it matter? Reversible decisions deserve
speed; only irreversible + consequential ones (bottom-right) earn deliberation.
Great for teams that over-process or founders who under-process.

**Origin.** Jeff Bezos's "Type 1 / Type 2 decisions" from Amazon shareholder
letters (1997, 2015), commonly expanded into this 2×2.

```typescript
{
  name: 'One-Way / Two-Way Doors',
  axisX: 'Consequence',
  axisY: 'Reversibility',
  quadrants: ['Just Decide', 'Experiment', "Don't Agonize", 'Deliberate'],
  colors: ['#4ade80', '#60a5fa', '#fbbf24', '#ef4444'],
  // Reversible decisions are green/blue (move fast);
  // irreversible + consequential is red (slow down, one-way door)
}
```

## 4. Risk Matrix — _Likelihood × Impact_

**Why it works.** The standard tool of risk management: severity is the
_product_ of how likely and how bad, and the two are routinely confused
(scary-but-rare vs. boring-but-constant). The gradient canvas is a perfect fit —
the canonical artifact is literally a green-to-red heatmap, and our corner
gradient reproduces it natively. Likely the best showcase of the color system in
the whole library.

**Origin.** Standardized across safety engineering and project management (e.g.,
PMBOK, ISO 31000 practice); the probability–impact grid long predates any single
author.

```typescript
{
  name: 'Risk Matrix',
  axisX: 'Likelihood',
  axisY: 'Impact',
  quadrants: ['Plan Contingency', 'Mitigate Now', 'Accept', 'Monitor'],
  colors: ['#fbbf24', '#ef4444', '#4ade80', '#f97316'],
  // Classic heatmap: green (low/low) → amber/orange (mixed) → red (high/high).
  // The corner gradient renders the canonical risk-heatmap diagonal.
}
```

## 5. Growth–Share Matrix (BCG) — _Market Share × Market Growth_

**Why it works.** The original strategy 2×2: where a portfolio item sits
determines whether you should feed it, milk it, or kill it. Stars need
investment, Cash Cows fund the Stars, Question Marks must prove themselves, Dogs
get divested. Works beyond business — people use it for side projects, content
channels, even hobbies.

**Origin.** Bruce Henderson, Boston Consulting Group, 1970. **Normalization
note:** the canonical chart inverts the x-axis (high share on the _left_).
Flipped here to match our right-=-more convention; the quadrant contents are
what matter, not the historical axis direction.

```typescript
{
  name: 'Growth–Share Matrix',
  axisX: 'Market Share',
  axisY: 'Market Growth',
  quadrants: ['Question Marks', 'Stars', 'Dogs', 'Cash Cows'],
  colors: ['#a78bfa', '#fbbf24', '#94a3b8', '#4ade80'],
  // Question Marks = violet (uncertain) · Stars = amber (gold star) ·
  // Dogs = slate (sunset) · Cash Cows = green (money)
}
```

## 6. Ansoff Matrix — _Products (Existing/New) × Markets (Existing/New)_

**Why it works.** Maps the four growth strategies by what's _new to you_: new
product, new market, both, or neither. Its real lesson is risk: danger compounds
toward the top-right (Diversification = new product _and_ new market). The color
ramp encodes that risk story.

**Origin.** Igor Ansoff, "Strategies for Diversification," _Harvard Business
Review_, 1957.

```typescript
{
  name: 'Ansoff Matrix',
  axisX: 'Existing / New Products',
  axisY: 'Existing / New Markets',
  quadrants: ['Market Development', 'Diversification', 'Market Penetration', 'Product Development'],
  colors: ['#fbbf24', '#ef4444', '#4ade80', '#fbbf24'],
  // Risk ramp: Penetration = green (safest) → amber (one new dimension)
  // → Diversification = red (both new). Two ambers is intentional symmetry.
}
```

## 7. Vision × Execution — _Completeness of Vision × Ability to Execute_

**Why it works.** The competitive-landscape 2×2: ideas without delivery are
Visionaries, delivery without direction are Challengers, both together are
Leaders. Useful for market scans, vendor selection, and honest self-assessment
of where your own product sits.

**Origin.** This is the structure of Gartner's Magic Quadrant. ⚠️ **"Magic
Quadrant" is a Gartner trademark** — ship under the generic "Vision × Execution"
name, never the Gartner one.

```typescript
{
  name: 'Vision × Execution',
  axisX: 'Completeness of Vision',
  axisY: 'Ability to Execute',
  quadrants: ['Challengers', 'Leaders', 'Niche Players', 'Visionaries'],
  colors: ['#60a5fa', '#4ade80', '#94a3b8', '#a78bfa'],
  // Leaders = green · Challengers = blue (solid, grounded) ·
  // Visionaries = violet (imaginative) · Niche = slate
}
```

## 8. Power × Interest — _Interest × Power_

**Why it works.** The stakeholder-management standard: communication effort
should follow power and interest, not org-chart proximity or loudness. The
quadrant labels _are_ the playbook — each one is an instruction, which makes
this the most immediately actionable template in the set.

**Origin.** Aubrey Mendelow, 1991; a staple of PRINCE2/PMBOK stakeholder
analysis.

```typescript
{
  name: 'Power × Interest',
  axisX: 'Interest',
  axisY: 'Power',
  quadrants: ['Keep Satisfied', 'Manage Closely', 'Monitor', 'Keep Informed'],
  colors: ['#fbbf24', '#ef4444', '#94a3b8', '#60a5fa'],
  // Heat = required attention: red (manage closely) > amber > blue > slate
}
```

## 9. Knowns & Unknowns — _Knowledge × Awareness_

**Why it works.** Maps not what you know, but your _relationship_ to what you
know. Known unknowns become research questions; unknown knowns are tacit
assumptions worth surfacing; unknown unknowns are why you run experiments and
postmortems. Strong fit for project kickoffs and risk workshops.

**Origin.** Popularized by Donald Rumsfeld (2002 press briefing); the underlying
awareness-grid idea goes back to the Johari Window tradition.

```typescript
{
  name: 'Knowns & Unknowns',
  axisX: 'Knowledge',
  axisY: 'Awareness',
  quadrants: ['Known Unknowns', 'Known Knowns', 'Unknown Unknowns', 'Unknown Knowns'],
  colors: ['#60a5fa', '#4ade80', '#ef4444', '#a78bfa'],
  // Facts = green (solid) · Questions = blue (open inquiry) ·
  // Surprises = red (danger zone) · Intuitions = violet (tacit, hidden)
}
```

## 10. Certainty × Agreement — _Certainty × Agreement_

**Why it works.** Tells you _how to work_, not what to do: when you're certain
and aligned, plan; certain but misaligned, negotiate; aligned but uncertain,
experiment; neither, stabilize first. The standard answer to "why is this
project being run like a waterfall when nobody knows what we're building?"

**Origin.** Ralph Stacey's complexity matrix (the "Stacey Matrix"), widely
adapted in agile coaching.

```typescript
{
  name: 'Certainty × Agreement',
  axisX: 'Certainty',
  axisY: 'Agreement',
  quadrants: ['Experiment', 'Plan', 'Stabilize', 'Negotiate'],
  colors: ['#a78bfa', '#4ade80', '#ef4444', '#fbbf24'],
  // Plan = green (safe ground) · Experiment = violet (creative) ·
  // Negotiate = amber (friction) · Stabilize = red (near chaos)
}
```

## 11. Skill × Will — _Skill × Will_

**Why it works.** The coaching insight: management style should be a function of
the person-task pair, not the manager's personality. High skill + high will →
get out of the way; low skill + high will → teach; high skill + low will → find
the motivational blocker; low both → direct closely. Each quadrant label is the
management verb itself.

**Origin.** Popularized by Max Landsberg, _The Tao of Coaching_ (1996); descends
from Hersey–Blanchard situational leadership.

```typescript
{
  name: 'Skill × Will',
  axisX: 'Skill',
  axisY: 'Will',
  quadrants: ['Guide', 'Delegate', 'Direct', 'Motivate'],
  colors: ['#60a5fa', '#4ade80', '#fbbf24', '#f97316'],
  // Delegate = green (trust) · Guide = blue (teach) ·
  // Motivate = orange (energize) · Direct = amber (hands-on)
}
```

## 12. Johari Window — _Known to Self × Known to Others_

**Why it works.** Self-awareness as a shared-information problem: growth means
expanding the Open quadrant — shrinking Blind Spots via feedback and Hidden via
disclosure. The classic tool for feedback workshops, team trust-building, and
360 reviews.

**Origin.** Joseph Luft & Harrington Ingham, 1955 ("Johari" = Joe + Harry).

```typescript
{
  name: 'Johari Window',
  axisX: 'Known to Self',
  axisY: 'Known to Others',
  quadrants: ['Blind Spot', 'Open', 'Unknown', 'Hidden'],
  colors: ['#fbbf24', '#4ade80', '#94a3b8', '#60a5fa'],
  // Open = green (healthy) · Blind Spot = amber (caution, seek feedback) ·
  // Hidden = blue (private) · Unknown = slate (fog)
}
```

## 13. Competence Ladder — _Competence × Awareness_

**Why it works.** Learning isn't linear, it's a path through quadrants:
unconscious incompetence (you don't know what you don't know) → conscious
incompetence (the discouraging part) → conscious competence (effortful skill) →
unconscious competence (mastery). Naming the stage someone is in is itself
motivating — especially in the painful second stage.

**Origin.** Noel Burch, Gordon Training International, 1970s (the "four stages
of competence").

```typescript
{
  name: 'Competence Ladder',
  axisX: 'Competence',
  axisY: 'Awareness',
  quadrants: ['Conscious Incompetence', 'Conscious Competence', 'Unconscious Incompetence', 'Unconscious Competence'],
  colors: ['#fbbf24', '#60a5fa', '#94a3b8', '#4ade80'],
  // Journey: slate (oblivious) → amber (struggle) → blue (deliberate)
  // → green (mastery)
}
```

## 14. Passion × Proficiency — _Good At It × Love It_

**Why it works.** The career/energy audit. Skill and joy correlate less than
people assume; the dangerous quadrant is bottom-right — things you're good at
but quietly hate, which others keep handing you (Burnout Zone). Top-right is the
sweet spot worth re-architecting a role around. Equally useful for tasks,
projects, or whole jobs.

**Origin.** Folk model from career coaching; echoes one axis-pair of Ikigai and
"zone of genius" (Gay Hendricks, _The Big Leap_, 2009).

```typescript
{
  name: 'Passion × Proficiency',
  axisX: 'Good At It',
  axisY: 'Love It',
  quadrants: ['Invest', 'Sweet Spot', 'Avoid', 'Burnout Zone'],
  colors: ['#60a5fa', '#4ade80', '#94a3b8', '#f97316'],
  // Sweet Spot = green · Invest = blue (develop the skill) ·
  // Burnout Zone = orange (warning) · Avoid = slate
}
```

## 15. Mood Meter — _Pleasantness × Energy_

**Why it works.** Emotions plotted on two dimensions instead of a word-list: how
pleasant, and how activated. Naming the quadrant ("I'm in the red — high-energy
unpleasant") is a research-backed regulation technique. The four colors below
are the _canonical_ palette of the model itself, and the corner gradient makes
this the most beautiful default in the library — a strong candidate for
marketing screenshots.

**Origin.** James Russell's circumplex model of affect (1980); popularized as
the Mood Meter by Marc Brackett, Yale Center for Emotional Intelligence (RULER
program; _Permission to Feel_, 2019).

```typescript
{
  name: 'Mood Meter',
  axisX: 'Pleasantness',
  axisY: 'Energy',
  quadrants: ['Tense', 'Excited', 'Down', 'Calm'],
  colors: ['#ef4444', '#fbbf24', '#60a5fa', '#4ade80'],
  // Canonical RULER colors: red (high energy / unpleasant) ·
  // yellow (high/pleasant) · blue (low/unpleasant) · green (low/pleasant)
}
```

## 16. Importance × Satisfaction — _Satisfaction × Importance_

**Why it works.** Opportunity = important to users + poorly served today
(top-left). Equally good at exposing over-investment: the bottom-right
"Overkill" quadrant is where teams polish things nobody values. The classic lens
for survey-driven roadmap prioritization.

**Origin.** Importance–Performance Analysis (Martilla & James, _Journal of
Marketing_, 1977); revived as opportunity scoring in Anthony Ulwick's
outcome-driven innovation.

```typescript
{
  name: 'Importance × Satisfaction',
  axisX: 'Satisfaction',
  axisY: 'Importance',
  quadrants: ['Focus Here', 'Keep It Up', 'Low Priority', 'Overkill'],
  colors: ['#f97316', '#4ade80', '#94a3b8', '#fbbf24'],
  // Focus Here = orange (the opportunity, demands attention) ·
  // Keep It Up = green · Overkill = amber · Low Priority = slate
}
```

## 17. Worry Matrix — _Control × Importance_

**Why it works.** The Stoic dichotomy of control as a 2×2: worry is only
productive where you have both stakes and agency (top-right). Everything
important-but-uncontrollable is acceptance work, not action work. A gentle,
personal-wellbeing counterpart to the Eisenhower Matrix.

**Origin.** Epictetus's dichotomy of control; Covey's Circles of
Concern/Influence (_7 Habits_, 1989), commonly adapted into this grid in CBT and
coaching contexts.

```typescript
{
  name: 'Worry Matrix',
  axisX: 'Control',
  axisY: 'Importance',
  quadrants: ['Accept & Adapt', 'Take Action', 'Let It Go', 'Not Worth It'],
  colors: ['#60a5fa', '#4ade80', '#94a3b8', '#fbbf24'],
  // Take Action = green (agency) · Accept & Adapt = blue (calm acceptance) ·
  // Let It Go = slate (release) · Not Worth It = amber
}
```

## 18. How–Now–Wow — _Originality × Ease of Implementation_

**Why it works.** Brainstorm triage that protects original ideas from being
killed by feasibility-talk: "Now" ideas keep momentum, "Wow" ideas (original
_and_ doable) are the gold, "How" ideas are worth incubating until they become
feasible. The fourth quadrant (unoriginal and hard) gets dropped — labeled
"Ciao" in the original.

**Origin.** _Gamestorming_ (Dave Gray, Sunni Brown, James Macanufo, 2010).

```typescript
{
  name: 'How–Now–Wow',
  axisX: 'Originality',
  axisY: 'Ease of Implementation',
  quadrants: ['Now', 'Wow', 'Ciao', 'How'],
  colors: ['#60a5fa', '#fbbf24', '#94a3b8', '#a78bfa'],
  // Wow = amber (gold) · Now = blue (steady) · How = violet (incubate) ·
  // Ciao = slate (discard)
}
```

---

## Considered and excluded

- **Political Compass** (economic × social axes) — well-known but politically
  charged; wrong tone for a default library. Users can build it themselves.
- **Cynefin** — five domains, not a true 2×2; Certainty × Agreement (#10) covers
  the same ground in quadrant form.
- **Ikigai** — four overlapping circles, not two axes. Passion × Proficiency
  (#14) captures its most actionable tension.
- **Kano model** — axes are right, but the payoff is the _curves_
  (delighters/basics), which a quadrant layout can't express honestly.
- **Blake–Mouton Managerial Grid** (concern for people × production) — a 9×9
  with five named styles; collapses awkwardly to four quadrants. Skill × Will
  serves the management-style niche better.
- **Wardley Maps, Hype Cycle** — x/y but not quadrant-structured.

---

## Retrofit: colors for the six shipped presets

None of the current presets define `colors`, so all six render identically.
Giving each a distinct, semantically coherent palette makes the picker scannable
at a glance:

```typescript
// Start / Stop / Continue / Change — [Continue, Start, Stop, Change]
colors: ['#4ade80', '#60a5fa', '#ef4444', '#fbbf24']
// Continue = green · Start = blue (new) · Stop = red · Change = amber

// Keep / Problem / Try / Question — [Keep, Problem, Try, Question]
colors: ['#4ade80', '#ef4444', '#60a5fa', '#a78bfa']
// Keep = green · Problem = red · Try = blue · Question = violet

// Love / Loathe / Learn / Leave — [Love, Loathe, Learn, Leave]
colors: ['#f472b6', '#ef4444', '#60a5fa', '#94a3b8']
// Love = pink · Loathe = red · Learn = blue · Leave = slate

// Eisenhower Matrix — see model #1 above

// SWOT Analysis — [Strengths, Weaknesses, Opportunities, Threats]
axisX: 'Helpful / Harmful',   // currently empty; SWOT does have real axes
axisY: 'External / Internal', // internal row on top in the canonical layout
colors: ['#4ade80', '#ef4444', '#60a5fa', '#f97316']
// Strengths = green · Weaknesses = red · Opportunities = blue · Threats = orange

// CRR — [Is Working, Desire, Get Rid Of, Renegotiate]
colors: ['#4ade80', '#60a5fa', '#94a3b8', '#fbbf24']
// Is Working = green · Desire = blue · Get Rid Of = slate · Renegotiate = amber
```

(SWOT axis caveat: canonically internal is the _top_ row and helpful the _left_
column, which inverts our up-=-more reading. The labels above preserve the
canonical layout; written as `'A / B'` they read left/bottom → right/top, hence
`'External / Internal'`.)

---

## Observations beyond the data (for future tickets, not this batch)

1. **A `description` field would do the most for scannability.** The picker
   today shows only names. A one-line "when to use" per template (the _Why it
   works_ lines above, compressed) would let users choose without already
   knowing the model. Smallest possible schema addition.
2. **Categories.** At ~20 templates a flat 2-column grid stops working. The
   natural grouping that emerged: **Prioritize** (1–4), **Strategize** (5–8),
   **Understand** (9–10, 12–13), **People & Self** (11, 14–15, 17), **Build**
   (16, 18), **Retrospect** (the four shipped retro templates).
3. **Per-end axis labels** (`low`/`high` endpoints instead of one string) would
   fix the bipolar-axis awkwardness (Ansoff, SWOT, Johari) — but the `'A / B'`
   convention is serviceable for now; not worth schema churn for this batch.
4. **The corner gradient is a differentiator.** Models with a canonical color
   story (Mood Meter, Risk Matrix) look _better_ in this app than in their
   textbook form. Worth leading with those two in any showcase ordering.
