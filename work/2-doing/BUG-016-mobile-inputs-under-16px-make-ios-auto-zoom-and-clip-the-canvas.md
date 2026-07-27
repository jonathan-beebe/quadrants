---
id: BUG-016
type: bug
status: open
created: 2026-07-27
---

# BUG-016: mobile inputs under 16px make iOS auto-zoom and clip the canvas

## Problem

On mobile, the app zooms itself in and the canvas edges get clipped. Two facts
combine. First, iOS Safari zooms the layout viewport whenever a form control
with computed `font-size < 16px` takes focus, and nearly every control in the
app is under that floor: `FrameworkBuilder.tsx:186-193` (Framework Name,
`text-sm`/14px and `autoFocus` — so entering the builder to pick a framework
zooms on arrival), `FrameworkBuilder.tsx:131-139` (template filter search,
`text-sm`), `FrameworkBuilder.tsx:208-222` (quadrant labels `text-sm`, X/Y axis
labels `text-xs`/12px), `Card.tsx:265-267` (inline item textarea,
`text-[13px]`), `ColorPicker.tsx:113-119`, `DesignSystem.tsx:319`.
`EditModal.tsx:93-100` is the lone exception at `text-base`/16px and does not
trigger it. Second, `index.html:5` sets only
`width=device-width, initial-scale=1.0`, and iOS never restores scale on blur —
so the zoom is sticky, and the user must pinch back out by hand. While scaled,
the visual viewport is smaller than the layout viewport, so the canvas — sized
to the full viewport at `QuadrantCanvas.tsx:166` and via
`--visual-viewport-height` — overflows it and its edges are cut off.

## Goal

No action the user takes inside the app ever changes the page's zoom level, so
the canvas the app draws is the canvas the user sees.

## Outcome

On mobile Safari at default scale, focusing any editable control in the app —
the framework name field on entering the builder, the template filter, a
quadrant or axis label, an item's inline text, the color picker's custom input —
leaves the page scale unchanged, and the canvas edges stay fully visible
throughout. After a user deliberately pinch-zooms and pinch-zooms back out,
subsequent app actions (picking a framework, editing an item) still do not
re-zoom. Pinch-to-zoom itself remains available to the user at all times.

## Why it matters

The canvas is the product — a clipped canvas hides cards and quadrant labels,
and the zoomed state makes drag targets land in the wrong place. The user has to
manually pinch out to recover, repeatedly, because the app re-zooms on the next
edit. It also silently violates WCAG SC 1.4.4 in the other direction: the app is
overriding the user's chosen scale without consent.

## Discovery notes

Advisory — `/work-start` may use or discard.

- Root cause is a single rule: iOS Safari auto-zooms on focus of
  `input`/`textarea`/`select` whose computed font-size is under 16px. Raising
  every focusable control to >= 16px removes the behavior entirely. This is
  well-trodden and needs no viewport-meta change.
- Deliberately NOT in scope: `user-scalable=no` / `maximum-scale=1`. It violates
  WCAG SC 1.4.4 Resize Text (AA), which `CLAUDE.md` mandates, and it does not
  even work — Apple has ignored `user-scalable=no` for pinch since iOS 10. It
  would suppress zoom only on Android/Chrome while leaving the actual reported
  symptom on iOS untouched. The human explicitly agreed to this boundary when
  scoping.
- There is no shared `Input` atom (`src/components/atoms/` holds only Badge,
  Button, Caption, PageTitle, SectionLabel, and the two toggle buttons). The
  maker may want a base-layer rule in `src/index.css`, a new atom, or
  per-callsite classes — a regression guard that no focusable control ships
  under 16px is worth more than which of those is chosen.
- Watch the visual consequences. `text-[13px]` on Card items and `text-xs` on
  the rotated Y-axis rail are load-bearing: `Card.tsx` sizes the editing
  textarea to match the display text so the card does not jump on edit, and
  `FrameworkBuilder.tsx:206-212` comments that the rail's 132px unrotated box
  must not widen the 36px column. A font-size bump changes both. One escape
  hatch, if the layout will not take 16px: the EditModal pattern already in the
  codebase — make the small control a trigger and edit at 16px in the modal.
- Reproduction: iOS Safari, real device (DevTools emulation does not reproduce
  focus auto-zoom). Load a framework, tap "New framework" — the page zooms as
  the name field autofocuses. Pinch out, then tap any card to edit — it zooms
  again.
- Verifiable without a device: assert computed font-size >= 16px on every
  focusable form control rendered by the app.
  `window.visualViewport.scale === 1` after focus is the on-device check.

## Related work

- BUG-015 — canvas sized to the visible viewport; this bug defeats that fix by
  shrinking the visible viewport under it.
- RSRCH-002 — in flight (`2-doing`), mobile keyboard occlusion. The same focus
  events are the trigger, so findings should be kept consistent.
- Commit `aa4e4c9` — the keyboard-aware EditModal, the existing `text-base`
  precedent.
- A11Y-019 — uses "zoomed" for the app's own quadrant zoom, an unrelated
  concept; don't conflate the two in naming.

## Working

Re-validated: every control the ticket names is still under the 16px threshold,
and `EditModal` is still wired only into `DesignSystem.tsx` (the design-system
demo from `aa4e4c9`), not into `Card`. Mobile item editing is therefore still
the inline 13px textarea, so it remains a live trigger. RSRCH-002 owns replacing
it.

Fix: one unlayered `@media (pointer: coarse)` block in `src/index.css` flooring
`input`/`textarea`/`select` at `max(16px, 1em)`.

- **Why one rule instead of eight callsite edits.** The floor cannot be
  forgotten at the next input added, which is what a per-callsite fix would
  invite. `src/index.css:124` already established the unlayered-block idiom for
  rules that must outrank utilities (`prefers-reduced-motion`), so this is an
  existing pattern rather than a new one.
- **Why unlayered.** Tailwind v4 orders utilities last, so from inside
  `@layer base` a callsite `text-sm` would beat the floor regardless of
  specificity. Verified against the built bundle: the utilities layer closes at
  offset 38954 and the floor is emitted at 39011 — outside it.
- **Why `(pointer: coarse)`.** The zoom is a touch-platform behavior; desktop
  has none. Scoping there leaves desktop rendering byte-identical and confines
  all visual change to the platform where the alternative (a clipped canvas that
  stays clipped) is strictly worse.
- **Why font-size only.** The paired line-heights from `text-sm`/`text-xs`
  survive, so vertical rhythm holds. This matters for the two layouts the ticket
  flagged: the quadrant label inputs keep their 62px rows (`text-sm`'s 20px
  line-height is untouched), so the Y-axis rail's 132px span still matches the
  grid height, and the rotated rail input stays inside its 36px column (~30px
  tall at 16px/16px line-height).

Tests: `src/__tests__/touchZoom.test.ts`, following the `a11yContrast.test.ts`
precedent of asserting a stylesheet invariant from source. Three guards — the
floor exists and covers all three control types, it is declared outside
`@layer`, and no component reintroduces a sub-16px size via an inline style
(inline styles beat even unlayered CSS). Both failure modes were
mutation-tested: nesting the block in `@layer base` fails guard 2, and an inline
`fontSize: 13px` on the Card textarea fails guard 3.

Full suite green (442 tests), lint clean, `tsc --noEmit` clean, production build
succeeds. `src/node-shims.d.ts` gained `readdirSync`/`Dirent` — the project
deliberately omits `@types/node`, so the guard's directory walk needed the
existing minimal shim extended rather than a new dependency.

### Known limits

- **Not verified on a device.** The repo has no headless browser, and jsdom
  implements neither cascade layers nor `(pointer: coarse)`, so the guards
  assert stylesheet intent rather than computed style. The cascade claim rests
  on the built-bundle offsets above plus the CSS Cascade Layers spec (unlayered
  normal declarations outrank all layered ones). On-device check:
  `window.visualViewport.scale === 1` after focusing a field.
- **Card text grows on tap-to-edit on touch.** The display button stays 13px
  while the textarea now renders at 16px, so the card grows when editing. This
  is a deliberate trade against the whole page zooming and the canvas clipping,
  and it disappears when RSRCH-002 routes mobile editing through `EditModal`
  (already 16px).
- **Double-tap-to-zoom is untouched**, as is pinch — both are user-initiated,
  and suppressing them was ruled out of scope during scoping (WCAG SC 1.4.4).
