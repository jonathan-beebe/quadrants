---
type: research
status: candidate
created: 2026-07-27
origin: BUG-016
---

# Candidate: form-control invariants have no component boundary to live in

Filed automatically while working BUG-016, per `work-start/types/bug.md`. Not an
allocated ticket — no id drawn, no journal entry. For the human to promote to
`1-inbox` (via `/work-scope`) or discard.

## Why this was filed

`src/components/atoms/` holds Badge, Button, Caption, PageTitle, SectionLabel,
and two toggle buttons. There is no `Input`, no `Field`, no `TextArea`. Every
form control in the app is a bare `<input>` / `<textarea>` with a hand-written
Tailwind class string, and there are roughly ten of them across
`FrameworkBuilder`, `Card`, `ColorPicker`, `EditModal`, and `DesignSystem`.

Because there is no boundary, every invariant that ought to hold for "a text
field in this app" has had to be discovered as a defect and then enforced from
somewhere else. The recurrence is the signal:

- **A11Y-018** (done) — placeholder text failed AA contrast on every input.
  Fixed with a global `::placeholder` rule in `index.css` plus a token-contrast
  assertion in `a11yContrast.test.ts`.
- **A11Y-002, A11Y-009, A11Y-013** (done) — the ColorPicker trigger and its
  custom input each failed target size, and the custom input was unreachable by
  keyboard. Three separate tickets against controls in one component.
- **A11Y-017** (done) — toast dismiss buttons under the 24px target floor.
- **BUG-016** (this one) — every control sat under the 16px font-size floor iOS
  needs, so focusing one zoomed the page. Fixed with an unlayered
  `(pointer: coarse)` rule in `index.css` plus a source-scanning guard in
  `touchZoom.test.ts`.

Five of the six were fixed correctly and none of the fixes was wrong. The point
is the shape they share: a control-level rule enforced by a global stylesheet
rule and a test that reads source text, because there is no component through
which the rule could simply be true by construction.

## The smell

Two consequences worth weighing.

**The guards test source, not behavior.** `a11yContrast.test.ts` parses
`index.css` with a regex; `touchZoom.test.ts` does the same and additionally
walks `src/components/**/*.tsx` looking for inline `fontSize`. Both were the
right call given the constraints — jsdom implements neither cascade layers nor
`(pointer: coarse)`, and the repo has no headless browser — but they assert
authored intent rather than what a control actually computes to. A shared
component would let the same invariants be asserted once, behaviorally, against
a rendered control.

**Enforcement is spread across three mechanisms.** A new `<input>` added
tomorrow inherits the font-size floor and the placeholder color from
`index.css`, but nothing gives it the target size A11Y-002/009/017 established
or the label wiring `EditModal` does by hand with `useId` (RFCTR-007). Which
invariants are automatic and which must be remembered is not written down
anywhere.

## What research would settle

Whether these controls should pass through a shared component (or a small set:
text field, textarea, color swatch), what invariants that boundary would own —
font-size floor, target size, placeholder contrast, label association, focus
indicator — and which are better left to global CSS because they apply to
controls the app does not own. Also worth settling: whether the source-scanning
guards should survive a boundary, or be replaced by behavioral tests against the
component.

Sequencing note: RSRCH-002 is open and will change how mobile item editing works
(routing it through `EditModal` rather than `Card`'s inline textarea). That
moves one of the controls in question, so this is probably worth sequencing
after it rather than alongside.

## Related, but a different axis

`viewport-height-sizing-has-no-shared-answer.md` (origin BUG-015) asks who owns
"how tall is the usable viewport". BUG-016 adds a fourth viewport state to that
question — **page scale**. The canvas is sized to the visual viewport, so any
scale change silently clips it, and until this fix the app was changing its own
scale as a side effect of focusing a field. If that candidate is promoted, the
scale state belongs in its scope; the form-control boundary above does not.
