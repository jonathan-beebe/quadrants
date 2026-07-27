---
id: RFCTR-007
type: refactor
status: resolved
created: 2026-07-27
---

# RFCTR-007: edit-modal-ids-from-useid-not-module-counter

## Problem

src/components/EditModal.tsx generates unique element ids with a module-level
mutable counter (`let nextId = 0`, line 19) consumed in a useState initializer
(lines 45-48) to build `edit-modal-title-${n}` / `edit-modal-field-${n}` for
aria-labelledby and the label/field pairing. React ships useId for exactly this;
the hand-rolled scheme is module-level mutable state the component doesn't need,
and under StrictMode the initializer's double invocation increments the counter
twice per mount — harmless but confusing to readers.

## Goal

EditModal's accessible-name wiring uses the standard React id mechanism with no
custom id machinery left behind.

## Outcome

EditModal instances still get unique, correctly paired title/field ids — the
dialog is labelled by its title, the label is associated with the textarea, and
two sequential mounts get distinct ids — with no module-level mutable state in
the file. All existing tests in src/**tests**/EditModal.test.tsx pass unchanged,
including "gives each instance its own label and field ids, so two can coexist"
(lines 84-93).

## Why it matters

Reviewer criterion — use common React patterns, avoid being overly clever. The
counter is avoidable module-level mutable state; useId is StrictMode-safe and
SSR-safe, and removing the custom scheme keeps the display layer boringly
conventional. The coexistence test already protects the behavior, so the
cleverness can go with zero behavioral risk.

## Discovery notes

Advisory: `const id = useId()` with derived suffixes (e.g. `${id}-title`,
`${id}-field`) replaces both the counter and the id-generating useState; the
file's only current React import line already exists for the other hooks. No
other component in src/ uses this counter pattern, and none uses useId yet —
this introduces the standard hook cleanly. The change is display-layer-only,
mechanical, and test-protected; the coexistence test asserts distinctness, not
the id format, so it must not be rewritten.

## Related work

- aa4e4c9 (feat: add a keyboard-aware EditModal to the design system —
  introduced the counter)
- RSRCH-001 (accepted ambient effects in the functional core — concerns core
  time/randomness, not display-layer element ids, so it does not constrain this
  change)
- RSRCH-002 (in 2-doing — the EditModal's parent research; this change is
  orthogonal to its keyboard concerns)

## Working

Re-validated: the counter was still in place, and nothing outside the component
referenced the `edit-modal-*` id format, so the change is contained to the file.

Of the three behaviors the Outcome names, two were already protected — the
dialog's accessible name (via `getByRole('dialog', { name })`) and id
distinctness across sequential mounts. The label/field pairing was not, so a
characterization test went in first and passed against the counter:
`getByLabelText('Item text')` finds the textarea. That is precisely what a
mis-derived suffix would break, and it is now caught.

`const id = useId()` with `${id}-title` / `${id}-field` suffixes replaced both
the counter and the id-generating `useState`. The ids object is plain derived
strings now rather than state, which is right — it depends on nothing but the id
and is not read across renders.

The coexistence test was left exactly as written, as the notes required; it
still passes, because React's client `useId` draws from a per-call global
counter and so never repeats across mounts.

Checked that React's colon-bearing ids (`:r0:-title`) are safe here: nothing
looks these up through `querySelector`/`getElementById` — the pairing goes
through `htmlFor`/`aria-labelledby`, and `useFocusTrap` selects by its own
focusable selector, not by id.

No module-level mutable state remains in the file (verified by grep). All nine
EditModal tests pass. `npm run ci` fully green.
