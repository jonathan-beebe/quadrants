---
id: IMPRV-006
type: improvement
status: open
created: 2026-07-28
---

# IMPRV-006: route mobile item editing through the top-aligned EditModal

## Problem

On mobile, item editing happens inside the zoomed grid cell: `Card.tsx:264-280`
swaps the display button for an inline `<textarea>` within
`MobileQuadrantGrid`'s overflow-hidden, transform-panned cell. RSRCH-002
measured the consequence on iOS 18.7: the keyboard takes ~47% of the small
viewport, iOS pans the visual viewport up to 383px to rescue a bottom-positioned
field (dragging the grid off-screen under the user), the overflow-hidden pan
model disables the browser's own scroll-rescue, and the keyboard drops between
edits because `commitEdit` unmounts the textarea. The passive-useEffect focus at
`Card.tsx:84-91` runs outside the tap gesture, so WebKit will not raise the
keyboard for it. The add flow compounds this: a PLACEHOLDER item is persisted
first and auto-focused via `autoFocusId` (`QuadrantCanvas.tsx:35`), the
mechanism behind BUG-009 and BUG-004.

Both halves of the remedy are already built and proven in the design system;
neither is wired into the canvas. The editing surface exists as
`src/components/EditModal.tsx` — top-aligned, gesture-synchronous focus,
visual-viewport-clamped, controls in-surface — but mounts only from
`DesignSystem.tsx`. The routing judgment exists as `useExpectsOnScreenKeyboard`
(`src/hooks/useExpectsOnScreenKeyboard.ts` over `src/logic/onScreenKeyboard.ts`)
— it decides whether this device shows an on-screen keyboard — but nothing in
the edit path consults it. This ticket is the wiring: implement those existing
components onto the actual canvas edit and add flows.

## Goal

Mobile item editing and adding happen in a surface the on-screen keyboard cannot
occlude and that never moves under the user.

## Outcome

- On a device that expects an on-screen keyboard, tapping an item's text on the
  canvas opens the edit modal with the text selected and the keyboard raised by
  that same tap; press-and-drag still drags the card on the canvas.
- While the keyboard is up, the field and the modal's Save/Cancel/Delete
  controls are fully visible; the visual viewport does not pan and the grid
  neither resizes nor pans beneath the modal.
- Adding an item on such a device opens the same modal; the item appears on the
  canvas only after Save, and Cancel leaves no placeholder card behind.
- Dismissing the modal (any path) returns focus per the A11Y-022 contract;
  A11Y-019's hidden-off-screen-quadrant model is undisturbed.
- On devices that do not expect an on-screen keyboard, inline editing is
  unchanged.
- The full test suite is green, with integration coverage for the mobile edit,
  add, and cancel flows.

## Why it matters

Adding and editing items is the app's core interaction, and on mobile it goes
blind — the user types into a field the keyboard covers while the grid shifts
between every edit. RSRCH-002 established this cannot be fixed by CSS units or
container sizing (a 58% canvas cut) — relocating the edit surface dissolves it.

## Discovery notes

Advisory; use or discard. This is wiring, not building — both components exist
and carry their own tests (`DesignSystemEditModal.test.tsx`,
`useExpectsOnScreenKeyboard.test.ts`, `onScreenKeyboard.test.ts`). Reuse
`EditModal` as-is — it already encodes every device-verified constraint (top
alignment, useLayoutEffect focus inside the gesture, `--visual-viewport-height`
clamp, no bottom-pinned controls, `openerRef` focus return; the card's display
button is the natural opener). The keyboard only rises for focus taken during
gesture processing — React 19 flushes discrete-event updates synchronously, so
opening the modal from the pointer handler keeps the layout effect inside the
tap (device-confirmed); a deferred open loses the keyboard. Route by
`useExpectsOnScreenKeyboard`, not by the 768px `useIsMobile` breakpoint and not
by which grid is rendering — the hook exists because those proxies are wrong (a
landscape tablet clears 768px and still has an on-screen keyboard), and its
observation half self-corrects either verdict on the next focus (an iPad with a
keyboard case edits inline). `autoFocusId` and PLACEHOLDER stay for the inline
path but should be unreachable wherever the modal path is active — worth
asserting so BUG-009 cannot re-arm there. `useVisualViewportHeight` already
follows the BUG-012-safe shape (CSS var, no React state) — keep it that way.
Holding the keyboard open across items is explicitly out of scope (no editable
exists between edits; the surface no longer moving makes the per-edit cycle
acceptable). Removing the card's floating X on mobile (A11Y-001 thinning) is
optional follow-up, not required here.

## Related work

- RSRCH-002 — device evidence behind this pivot; closes as answered now that
  this ticket is filed
- A11Y-022 — EditModal's focus-return contract
- RFCTR-007 — EditModal ids from useId
- MAINT-008 — EditModal test posture
- RFCTR-006 — keyboard-size judgment extracted into the onScreenKeyboard core
- MAINT-006 — matchMedia fake so keyboard tests exercise the hook
- MAINT-007 — reset detaches the on-screen keyboard observation listeners
- BUG-004 — placeholder cleanup on inline cancel; retired on mobile by this
- BUG-009 — stale autoFocusId re-opening edit mode; retired on mobile by this
- BUG-012 — caution precedent: no viewport-reactive React state
- A11Y-019 — inert/pan model that must stay undisturbed
- A11Y-001 — interactive-descendant thinning this enables as follow-up
- BUG-015 — `h-svh` canvas sizing history
- BUG-016 — 16px input floor / iOS auto-zoom history
- c7bffeb — wired up MobileQuadrantGrid
- e0c84fc — extracted MobileQuadrantGrid
- aa468c4 — A11Y-022 focus restore
- 4b1b98b — keyboard-probe corrections

## Working

- Re-validated: `Card.tsx` still edits inline via the passive `useEffect`
  (`Card.tsx:84-91`), `handleAddItem` still persists PLACEHOLDER + `autoFocusId`
  (`QuadrantCanvas.tsx:76-84`), and neither grid consults
  `useExpectsOnScreenKeyboard`. `EditModal` and the hook are live in the design
  system only; `DesignSystemEditModal.test.tsx` shows the intended trigger
  semantics (verdict-gated, `aria-haspopup="dialog"`, open inside the gesture,
  A11Y-022 focus return).
- Shape: `Card` gains optional `onRequestEdit(opener)` consumed inside
  `enterEditMode` so tap and Enter/Space both route; grids thread it through
  `QuadrantGridProps` plus an opener element on `onAddItem`; `QuadrantCanvas`
  calls the hook once, owns `itemModal` state (itemId null = add), and mounts
  `EditModal` for both grids. Card's tap resolves in a native window pointerup
  listener, so the canvas opens the modal inside `flushSync` — React 19 only
  guarantees synchronous flushing for its own discrete events, and the modal's
  focus must land inside the tap (RSRCH-002).
- Tap = pointerup, not pointerdown as in the demo: the card cannot know
  tap-from-drag until the drag threshold resolves. Pointerup is still inside the
  user gesture; the probe's sync rung and the demo differ only in which pointer
  event hosts the focus.
