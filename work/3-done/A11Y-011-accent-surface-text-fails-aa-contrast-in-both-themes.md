---
id: A11Y-011
type: a11y
status: resolved
created: 2026-06-11
---

# A11Y-011: accent-surface text fails AA contrast in both themes

## Problem

White text is paired with the accent background on filled controls, failing WCAG
2.x SC 1.4.3 Contrast (Minimum) AA for normal-size text (4.5:1). `.btn-primary`
(src/index.css:77-80) is `bg-accent text-white` at text-sm/14px medium; light
theme `--color-accent: #3b82f6` (src/index.css:13) gives white 3.68:1, dark
theme `--color-accent: #60a5fa` (src/index.css:36) gives white ≈2.56:1. The same
failing pattern appears on the UpdateToast Reload button
(src/components/UpdateToast.tsx:19, `bg-accent text-white`, hover `bg-accent/90`
is worse) and the skip link focus state (src/App.tsx:128,
`focus:bg-accent focus:text-white`). Dark-theme hover
`--color-accent-hover: #3b82f6` (src/index.css:37) also fails with white
(3.68:1).

## Outcome

In both themes, the text/background contrast ratio of btn-primary buttons (e.g.
"Create Framework" in EmptyState, FrameworkBuilder submit, Sidebar "New
Framework"), the UpdateToast Reload button, and the focused skip link measures
at least 4.5:1 in default and hover states, verifiable with a contrast checker
or computed-style assertion.

## Why it matters

Low-vision users cannot reliably read the app's primary action buttons, the
update Reload control, and the skip link — the most important interactive text
in the app. CLAUDE.md mandates strict WCAG adherence; SC 1.4.3 Level AA is
violated today, worst in dark mode.

## Discovery notes

Advisory — /work-start may use or discard. Root cause: the accent token was
chosen for brand/visuals and the white-on-accent pairing was never
contrast-checked; dark mode lightens the accent (#60a5fa) while keeping white
text, making contrast worse. The pairing is hardcoded in three places
(btn-primary component class, UpdateToast, App.tsx skip link) rather than via a
single on-accent token.

## Recommendation

Per-theme remedy. Light theme: darken the accent used for filled surfaces to
blue-600 #2563eb — white on #2563eb = 5.17:1 (passes). Dark theme: keep the
light #60a5fa accent but switch the foreground to dark text (e.g. near-black
#111827 on #60a5fa ≈ 7.9:1, passes). Cleanest mechanism: introduce a dedicated
`--color-on-accent` token themed alongside `--color-accent`, and replace
`text-white` with it in btn-primary, UpdateToast Reload, and the skip link.
Ensure hover surfaces also pass: light hover #1d4ed8 (blue-700) with white =
6.39:1; dark hover must not fall back to white-on-#3b82f6 — re-pick the dark
hover (e.g. #93c5fd with dark text) or verify the chosen pair >= 4.5:1.
Measurements to assert: light default >= 5.17:1, dark default >= 7:1, all
states >= 4.5:1. If broader token-pairing audits are wanted (danger,
accent-light), route that to a research ticket — this ticket covers only the
accent/on-accent pairing.

## Related work

- A11Y-001…A11Y-010 (resolved accessibility tickets; none address contrast)

## Working

- Followed the ticket's recommendation exactly: light #2563eb/#1d4ed8 fills with
  white on-accent; dark keeps #60a5fa with #111827 on-accent and re-picked hover
  #93c5fd (dark text ≈10:1).
- All three hardcoded pairings now use the token: btn-primary, UpdateToast
  Reload (also swapped its `hover:bg-accent/90` opacity hover for
  `hover:bg-accent-hover`), skip link.
- Regression guard: `src/__tests__/a11yContrast.test.ts` parses the theme tokens
  out of index.css and asserts accent/on-accent ≥4.5:1 for default and hover in
  both themes. (`?raw` CSS imports come back empty under the vitest config, so
  the test reads the file via node:fs with a minimal src/node-shims.d.ts
  declaration — the project has no @types/node.)
- Side effect noted: light `text-accent` links and focus outlines now use
  blue-600 — strictly higher contrast everywhere.
- Broader token-pairing audit not routed to research: A11Y-012 (danger) and
  A11Y-018 (placeholder) already cover the remaining audit findings.
