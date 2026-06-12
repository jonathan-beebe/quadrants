---
id: A11Y-017
type: a11y
status: resolved
created: 2026-06-11
---

# A11Y-017: toast dismiss buttons fail 24px target-size floor

## Problem

The dismiss buttons in `src/components/Toast.tsx:14-18` and
`src/components/UpdateToast.tsx:22-27` (UpdateToastView) are ~18×18px
interactive targets — `p-0.5` (2px padding) around a 14px XIcon — below the
24×24px minimum target size. The Toast dismiss is the only way to clear an error
toast (no auto-dismiss), and the UpdateToast dismiss sits next to the Reload
button (gap-3). Both toasts are fixed-position at the bottom of the viewport,
frequently reached on touch devices.

## Outcome

The dismiss buttons in Toast and UpdateToastView each present an interactive hit
area of at least 24×24 CSS pixels, with no other sub-24px interactive targets
remaining in either component, and toast visuals are not materially changed.

## Why it matters

WCAG 2.5.8 Target Size (Minimum), Level AA. While 2.5.8's spacing exception
might strictly excuse these, CLAUDE.md mandates strict WCAG adherence and
favoring highly-accessible solutions, and four resolved tickets established
24×24px as the hard floor for small icon buttons — these two dismiss buttons are
the remaining stragglers from the earlier target-size sweeps. Small
fixed-position targets at screen bottom hurt most on mobile.

## Discovery notes

Root cause is the same pattern as the previously fixed tickets — icon-sized
padding chosen for visual density; these two buttons were not included in the
earlier sweeps.

## Recommendation

Bring each dismiss button to ≥24×24px without enlarging the 14px icon — e.g.
`w-6 h-6 grid place-items-center` (the pattern used for the fixed Card delete
button) or `p-[5px]` around the 14px icon (5+14+5 = 24). Apply to both Toast and
UpdateToastView. Passing measurement: each dismiss button's hit area ≥24×24 CSS
pixels. Quick-check both components for any other sub-24px interactive targets
(UpdateToastView's Reload button has `px-3 py-1` text content and should be
verified ≥24px tall).

## Related work

- A11Y-002 (target-size precedent, work/3-done)
- A11Y-003 (target-size precedent, work/3-done)
- A11Y-008 (target-size precedent, work/3-done)
- A11Y-009 (target-size precedent, work/3-done)
- A11Y-007 (UpdateToast roles, work/3-done)

## Working

- Used the ticket's preferred `w-6 h-6 grid place-items-center` pattern (matches
  the Card delete button precedent from A11Y-003).
- Quick-checked both components for other sub-24px targets: UpdateToast Reload
  is px-3 py-1 text-sm → 4+20+4 = 28px tall, passes; no other interactive
  targets in either component.
- No new tests: jsdom computes no layout, so a size assertion would only pin
  class strings (the project's testing principle forbids that); the shared
  pattern is already established in four resolved tickets.
