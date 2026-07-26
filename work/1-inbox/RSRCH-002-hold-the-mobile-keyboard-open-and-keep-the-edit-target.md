---
id: RSRCH-002
type: research
status: open
created: 2026-07-26
---

# RSRCH-002: hold the mobile keyboard open and keep the edit target above it

## Problem

On mobile, an item's inline edit input sits inside a grid cell whose height is
derived from the viewport: `QuadrantCanvas.tsx:166` is `flex flex-col h-screen`,
and `MobileQuadrantGrid.tsx:55` is `flex-1 min-h-0 overflow-hidden` wrapping a
2x2 grid at `w-[200%] h-[200%]` panned by transform (`CELL_TRANSFORMS`, lines
15-21). Nothing in that chain accounts for the on-screen keyboard, so when the
keyboard opens it covers the bottom of the zoomed cell — including, depending on
the item's position, the input being typed into. It is not known what mechanism
this app can use to keep the keyboard from occluding the edit target, nor
whether the keyboard can be held open across edits (rather than opening and
dismissing per input) on the platforms this PWA ships to. iOS is an explicit
target (`public/apple-touch-icon.png`, `display: 'standalone'` in
`vite.config.js:74`) and is where keyboard control is most constrained.

## Goal

Know how to keep the mobile edit target clear of the on-screen keyboard, with a
keyboard that stays put instead of opening and closing under the user.

## Outcome

A written recommendation exists that answers, with evidence gathered on real
devices rather than emulators:

1. What the keyboard actually does to this app's layout on each target platform
   — which viewport the browser shrinks, shifts, or leaves alone, and what the
   zoomed cell measures before, during, and after an edit.
2. How to hold the keyboard open across an editing session — from first tap to
   deliberate dismissal — including what user actions can still dismiss it and
   which of those the app can intercept. Where a platform admits no method, that
   is established by demonstration, not assumed, and the closest achievable
   behavior is named.
3. How the cell's bottom edge can be brought to rest above the keyboard, and
   what that costs in cell size and legibility at the smallest supported screen.
4. A recommendation naming the mechanism to adopt per platform, with follow-up
   tickets filed for the implementation, or the status quo recorded as accepted
   with the reason.

## Why it matters

Adding and editing items is the core interaction of the app, and on mobile it is
the one that goes blind — the user types into a field the keyboard is covering.
The per-edit open/close cycle compounds it: the grid resizes under the user
between every item, so the thing they are aiming at moves. Without knowing what
each platform permits, any fix is guesswork, and guesswork here is expensive
because it can only be judged on real hardware.

## Discovery notes

Advisory. Leads worth evaluating, none verified here — `visualViewport` (height
plus resize/scroll events; present on both iOS Safari and Android Chrome, and
the only signal iOS offers); the
`interactive-widget=resizes-content | resizes-visual | overlays-content`
meta-viewport parameter (Chromium only); the VirtualKeyboard API
(`navigator.virtualKeyboard.overlaysContent`) with the `env(keyboard-inset-*)`
CSS variables (Chromium only); and the `svh` / `lvh` / `dvh` units, noting that
on iOS the keyboard shifts the visual viewport without shrinking the layout
viewport, so `dvh` may not move at all there.

On holding the keyboard open: there is no API to summon a keyboard without a
focused editable element, and moving focus between inputs synchronously within
the same user gesture is the known way to avoid a dismissal — worth testing
whether that survives this app's edit-session lifecycle, and what happens on the
platform's own "Done" affordance and on scroll-away. Standalone PWA mode may
behave differently from the same page in Safari — test both.

Note A11Y-019's constraint: three quadrants are panned off-screen and hidden
from AT while zoomed, so anything that rescales or repositions the grid must not
disturb that. BUG-012 is a cautionary precedent — reacting to viewport changes
with state caused spontaneous focus and inert changes.

Deliverable is the decision plus device evidence; implementation belongs in
follow-up tickets.

## Related work

- A11Y-019 — zoom/pan model of the mobile grid; off-screen quadrants hidden from
  AT, and a keyboard-driven resize must not disturb it
- A11Y-001 — mobile quadrant nested interactive descendants
- BUG-009 — stale `autoFocusId` re-opening edit mode on grid remount; remount
  behavior around the edit session
- BUG-012 — viewport-change handling already caused spontaneous state changes
  once
- BUG-003
- c7bffeb — wired up `MobileQuadrantGrid`
- e0c84fc — extracted `MobileQuadrantGrid`
