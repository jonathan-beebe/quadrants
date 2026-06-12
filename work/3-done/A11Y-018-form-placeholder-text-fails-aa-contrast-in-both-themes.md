---
id: A11Y-018
type: a11y
status: resolved
created: 2026-06-11
---

# A11Y-018: form placeholder text fails AA contrast in both themes

## Problem

Placeholder text in all form inputs renders below the WCAG 1.4.3 Contrast
(Minimum), Level AA 4.5:1 threshold. The project uses Tailwind CSS v4
(src/index.css `@import "tailwindcss"`), whose preflight sets
`::placeholder { color: color-mix(in oklab, currentColor 50%, transparent) }` —
placeholders draw at 50% opacity of the input's text color, and no component or
global style overrides this. On the light theme (`--color-text: #111827` on
white/`#fafafa` surfaces) this yields roughly 3.2–3.6:1; inputs whose text color
is text-text-secondary (#4b5563) fare worse. The dark theme (50% of #f9fafb on
#1f2937) is similarly failing. Affected inputs, all in
src/components/FrameworkBuilder.tsx: template filter "Filter templates…" (line
116), framework name "e.g., My Decision Matrix" (line 170), Y-axis "Y axis
(optional)" (line 185), quadrant inputs "Quadrant 1..4" (line 197), X-axis "X
axis (optional)" (line 212).

## Outcome

In both light and dark themes, the placeholder text of every input in the
create-framework builder and the template filter measures at least 4.5:1
contrast against its input background, and placeholder text remains visually
distinguishable from user-entered text.

## Why it matters

The axis and quadrant inputs use the placeholder as the ONLY visible cue of the
field's purpose when empty (labels are aria-label only), so unreadable
placeholders directly impair low-vision users' ability to fill the
create-framework form — a primary app flow.

## Discovery notes

Root cause is the unadjusted Tailwind v4 preflight default, not any component
code. Placeholder contrast was not part of the earlier a11y sweeps
(A11Y-001…A11Y-010 covered target size/roles/focus, not contrast). Token check
at scoping time: `--color-text-tertiary` is #6b7280 (light) / #9ca3af (dark),
measuring ≈4.8:1 on #ffffff, ≈4.6:1 on #fafafa, and ≈4.7:1 on #1f2937 — all pass
4.5:1. Visible labels for the axis/quadrant inputs are out of scope (separate
design question); this ticket is contrast only.

## Recommendation

Set one explicit accessible placeholder color globally in src/index.css, e.g.
`::placeholder { color: var(--color-text-tertiary); opacity: 1; }` (opacity 1 is
required to defeat the preflight color-mix transparency). Verify with measured
contrast ratios that the chosen token clears 4.5:1 on every input surface in
both themes — if any surface fails, adjust or pick a darker/lighter token rather
than per-input overrides. Passing measurements: ≥4.5:1 for each affected
placeholder/background pair, in both themes.

## Related work

- A11Y-011 (work/1-inbox) — accent-surface text contrast, same audit; this is
  the form-text counterpart
- A11Y-012 (work/1-inbox) — danger-surface text contrast, same audit
- A11Y-001…A11Y-010 (work/3-done) — prior a11y sweeps covering target
  size/roles/focus, not contrast

## Working

- Implemented exactly the ticket's recommendation: one global rule, no per-input
  overrides.
- Verified token measurements via the shared a11yContrast.test.ts: text-tertiary
  vs surface and vs bg, both themes, all ≥4.5:1 (matches the ticket's
  scoping-time measurements: ~4.8/4.6/4.7).
- Placeholders remain distinguishable from entered text: inputs use text-text
  (#111827 light / #f9fafb dark), placeholders the lighter tertiary token.
- Visible labels for axis/quadrant inputs remain out of scope per the ticket.
