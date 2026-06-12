---
id: A11Y-014
type: a11y
status: resolved
created: 2026-06-11
---

# A11Y-014: card item button missing visible focus indicator

## Problem

The card item display button in src/components/Card.tsx shows no visible focus
indicator when focused via keyboard. Line 244 defines
`textClasses = 'flex-1 min-w-0 break-words outline-none rounded-sm'`, applied to
both the display-mode `<button>` (lines 274-283) and the editing `<textarea>`
(lines 257-272). Tailwind's `.outline-none` utility (utilities layer, later in
cascade at equal specificity) overrides the global
`*:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }`
rule in src/index.css (line 57, @layer base), so `outline-style: none` applies
in all states including :focus-visible. This violates WCAG 2.4.7 Focus Visible
(Level AA).

## Outcome

Tabbing to any card item on the quadrant canvas — desktop (QuadrantGrid) and
mobile zoomed view (MobileQuadrantGrid) — shows a clearly visible focus
indicator on the focused control itself, visible against the card's translucent
white/dark backgrounds in both themes; the keyboard interactions from A11Y-010
(Enter/Space edit, M move menu, arrow-key reposition) continue to work.

## Why it matters

The card item button is the PRIMARY keyboard target — it carries Enter/Space
(edit), M (move menu), and arrow keys (reposition, per A11Y-010). With no focus
indication, keyboard users literally cannot tell which item they're on before
pressing keys that mutate position. The delete button appearing via
`[div:focus-within>&]:opacity-100` is an indirect side effect, not a focus
indicator on the focused control. SC 2.4.7 Focus Visible, Level AA.

## Discovery notes

Root cause — `outline-none` was added to suppress the default outline for
pointer aesthetics without a :focus-visible replacement. The textarea is lower
priority (caret is visible while editing) but shares the same class.

## Recommendation

Drop `outline-none` from textClasses (letting the global \*:focus-visible
outline apply), or substitute
`focus-visible:outline-2 focus-visible:outline-accent` / a ring on the display
button. Verify: (1) the indicator renders with at least a 2px outline using the
accent color (or equivalent ring) on :focus-visible, (2) it is visible against
bg-white/85 (light) and dark:bg-white/10 (dark) card backgrounds, (3) no outline
appears on plain pointer click (use :focus-visible, not :focus), and (4)
A11Y-010 keyboard interactions still pass.

## Related work

- A11Y-010 (keyboard reposition — gave this button its keyboard powers)
- A11Y-003 (card delete button target size and touch visibility)

## Working

- Took the ticket's first option: remove `outline-none` and let the global
  `*:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px }`
  apply. No substitute ring needed.
- Verification per the ticket's four checks: (1) 2px accent outline via the base
  rule; (2) accent (#2563eb light / #60a5fa dark after A11Y-011) is clearly
  visible against the translucent card backgrounds with the 2px offset placing
  it on the quadrant surface; (3) :focus-visible only, so plain pointer clicks
  show no outline; (4) all A11Y-010 keyboard interaction tests stay green (full
  suite run).
- No new test: jsdom computes no styles, so the only assertable artifact would
  be the class string — implementation pinning the project's test principles
  forbid. The textarea shares the change (caret + outline while
  keyboard-editing), which the ticket marked low-priority but acceptable.
