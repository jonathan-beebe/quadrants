---
id: A11Y-012
type: a11y
status: resolved
created: 2026-06-11
---

# A11Y-012: error toast danger-surface text fails AA contrast in both themes

## Problem

The error Toast (src/components/Toast.tsx:12) pairs white text-sm text and a
white XIcon dismiss control with the danger background (`bg-danger text-white`).
Light theme `--color-danger: #ef4444` (src/index.css:16) gives white ≈3.7:1;
dark theme `--color-danger: #f87171` (src/index.css:39) gives white ≈2.8:1 —
both fail WCAG SC 1.4.3 Contrast (Minimum) AA (4.5:1 for normal-size text). The
white dismiss icon also risks failing SC 1.4.11 Non-text Contrast (3:1) in dark
mode (2.8:1).

## Outcome

In both light and dark themes, the Toast message text/background contrast ratio
measures at least 4.5:1 and the dismiss icon against its background measures at
least 3:1, in default and hover states, verifiable with a contrast checker or
computed-style assertion (Toast renders from src/App.tsx:176 for share/import
errors and in src/components/DesignSystem.tsx).

## Why it matters

The Toast is the app's only error surface — error messages are exactly the
content low-vision users must be able to read, and today they can't, worst in
dark mode (≈2.8:1). CLAUDE.md mandates strict WCAG adherence; SC 1.4.3 Level AA
is violated.

## Discovery notes

Advisory — /work-start may use or discard. Root cause: red-500/red-400 danger
tokens were paired with white text without contrast checking; dark mode lightens
the token (#f87171) while Toast keeps text-white, making contrast worse. Mirrors
the accent root cause in A11Y-011. `--color-danger-hover` is #dc2626 light /
#ef4444 dark (src/index.css:17,40).

## Recommendation

Per-theme remedy mirroring A11Y-011. Light theme: darken the danger fill used
for the toast to red-600 #dc2626 (white on #dc2626 ≈ 4.8:1, passes) or darker.
Dark theme: either keep a dark red fill with white text, or keep the light
#f87171 fill and switch to dark text (#111827 on #f87171 ≈ 6.4:1, passes).
Cleanest mechanism: introduce a `--color-on-danger` token themed alongside
`--color-danger` and replace `text-white` in Toast with it — consistent with the
`--color-on-accent` direction in A11Y-011; coordinate if both land. The dismiss
icon button inherits the foreground, so the same pairing must clear 3:1 (SC
1.4.11), including its hover state (`hover:bg-white/20` overlay must not drop
icon contrast below 3:1). Measurements to assert: light text >= 4.5:1, dark
text >= 4.5:1, dismiss icon >= 3:1 in all states. Buttons elsewhere using
`bg-danger` (if any) are out of scope unless trivially covered by the token
change.

## Related work

- A11Y-011 (work/1-inbox — same white-on-token pattern for
  accent/btn-primary/skip-link; this ticket is the danger-token counterpart,
  related not duplicate)
- A11Y-007 (work/3-done — UpdateToast role/aria-live, no contrast)
- A11Y-001…A11Y-010 (none cover contrast)

## Working

- Light: danger #dc2626 (white 4.83:1), hover #b91c1c (white 6.6:1). Dark: fill
  stays #f87171 with on-danger #111827 (≈6.4:1); dark hover #ef4444 with dark
  text ≈4.8:1 — all measured by the shared a11yContrast.test.ts added in
  A11Y-011.
- Dismiss icon inherits text-on-danger (≥4.5:1, clears the 3:1 non-text floor).
  Hover overlay: kept white/20 in light (white icon on lightened red ≈3.9:1,
  above the 3:1 icon floor) and switched to black/10 in dark so the dark icon
  gains contrast on hover rather than losing it.
- Side effect in scope ("trivially covered by the token change"): light-mode
  `text-danger` (Sidebar Delete item, Card delete hover) now uses #dc2626 =
  4.5:1 on white, an incidental fix of a borderline pair.
