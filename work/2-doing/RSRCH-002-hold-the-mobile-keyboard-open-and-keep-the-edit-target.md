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

Ruled out before device testing: `env(safe-area-inset-*)` cannot size a
container around the keyboard. Safe-area insets describe static display
obstructions — the notch, the home indicator, rounded corners — and are constant
for the life of an orientation; the keyboard is not part of that model and does
not grow them. On iOS the expectation is worse than neutral: the keyboard covers
the home indicator, so `safe-area-inset-bottom` is expected to report `0` while
the keyboard is up, moving a `calc()` sized against it in the wrong direction.
Confirm that on device — it is cheap to check alongside item 1 and may vary by
iOS version and between Safari and standalone mode — but do not spend a session
on it as a candidate mechanism. The keyboard-shaped analog is
`env(keyboard-inset-bottom)` from the VirtualKeyboard API already listed above,
which is Chromium-only and leaves iOS to `visualViewport`.

Baseline for that work: the app has no safe-area handling today. `index.html:5`
is `width=device-width, initial-scale=1.0` with no `viewport-fit=cover`, and
there is no `env(...)` anywhere in the source, so all four insets currently
resolve to `0`. Safe areas still belong in the implementation follow-up for a
separate reason — a container sized against the visual viewport should also
clear the home indicator in the no-keyboard state — but as a second inset
composed with the keyboard measurement, not as a substitute for it.

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

## Findings — desk half (established without a device)

### Re-validation of the premise

Still valid, with one stale reference. `QuadrantCanvas.tsx:166` is no longer
`h-screen` — BUG-015 (bc63326) changed it to `h-svh`, now at line 172. That does
not weaken the ticket; it sharpens it. `svh` is the **static** small viewport
unit: by specification it does not change for the life of the orientation. The
canvas is therefore not merely unaware of the keyboard, it is unable to react to
one. Everything else in the chain is unchanged.

The full chain, as it stands:

| Layer                | Where                        | Sizing                                     |
| -------------------- | ---------------------------- | ------------------------------------------ |
| `QuadrantCanvas`     | `QuadrantCanvas.tsx:172`     | `flex flex-col h-svh` — fixed, static      |
| header               | `QuadrantCanvas.tsx:174-175` | `shrink-0`, `px-3 py-2.5`                  |
| `MobileQuadrantGrid` | `MobileQuadrantGrid.tsx:56`  | `flex-1 min-h-0 overflow-hidden`           |
| grid                 | `MobileQuadrantGrid.tsx:59`  | `w-[200%] h-[200%]`, panned by transform   |
| cell canvas          | `MobileQuadrantGrid.tsx:121` | `flex-1 relative min-h-0`                  |
| `Card`               | `Card.tsx:258`               | `absolute`, `left: x%` / `top: y%` of cell |

A card at `y = 80%` therefore sits at 80% of the cell's height, and the cell is
the full viewport minus the header. `grep` confirms **zero** occurrences of
`visualViewport`, `dvh`, `lvh`, `interactive-widget`, `virtualKeyboard`, or
`env(` anywhere in `src/` or `index.html`. The app has no keyboard-awareness of
any kind to build on.

### The occlusion has two independent causes, not one

The ticket frames this as a viewport-sizing problem. Reading the edit path, that
is only half of it — and the smaller half.

**Cause 1 — the container cannot be scrolled to rescue the field.** Browsers
scroll a focused editable into the visual viewport by themselves, but only if it
sits in a scrollable ancestor. `MobileQuadrantGrid.tsx:56` is `overflow-hidden`,
and it is the only ancestor between the card and the fixed canvas. The
platform's own rescue mechanism is switched off by the pan model. This is
testable directly — the probe's chain overlay toggles that one property.

**Cause 2 — the keyboard has nothing to stay open for, by construction.** The
edit session ends by destroying the focused node:

- `Card.tsx:59` — `editing` starts as `autoFocus`; the `<textarea>` exists only
  while `editing` is true (`Card.tsx:264-297`).
- `Card.tsx:168-177` — `commitEdit` calls `setEditing(false)`, which unmounts
  the textarea and puts the display `<button>` back. Reached from blur
  (`Card.tsx:240-246`), Enter, and Escape (`Card.tsx:221-238`).
- Between one item and the next, the document holds **no editable focus target
  at all**. Nothing an API could ask for would keep a keyboard up over that gap
  — there is no way to summon a keyboard without a focused editable.

So "the keyboard opens and closes per input" is not a platform limitation the
app is suffering; it is a direct consequence of the component's own lifecycle.

**And the re-open is likely to be fighting the gesture rule.** `Card.tsx:84-91`
focuses the new textarea from a passive `useEffect`, which React runs _after
paint_, on a later task than the pointer event that triggered it. WebKit raises
the keyboard for a programmatic `focus()` only during user-gesture processing.
React 19 flushes discrete-event updates synchronously, so a `useLayoutEffect`
would run inside the commit that the tap itself drives — still within the
gesture — whereas the current `useEffect` deliberately does not. This applies to
both entry paths: the pointerup handler in `startPendingDrag`
(`Card.tsx:148-153`) and the Add button via `autoFocusId`
(`QuadrantCanvas.tsx:35`).

That yields a cheap, falsifiable hypothesis the device session can settle:
**`useEffect` → `useLayoutEffect` in `Card.tsx:84` is the difference between the
keyboard re-opening and not.** Probe section 4 tests exactly this ladder —
`sync` (in gesture) vs `timeout` / `raf` / `remount` (out of gesture).

### Mechanism inventory — what is knowable before the device session

| Mechanism                                     | Platforms      | Status without a device                                                                                                                          |
| --------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `visualViewport` height/offsetTop + events    | iOS + Chromium | The only signal iOS offers. Read-only, JS-driven. Viable — see the no-re-render note below.                                                      |
| `interactive-widget=resizes-content`          | Chromium only  | Shrinks the _layout_ viewport, so `svh`/`dvh` and ordinary CSS just work. Nothing equivalent exists on iOS.                                      |
| VirtualKeyboard API + `env(keyboard-inset-*)` | Chromium only  | Needs `navigator.virtualKeyboard.overlaysContent = true`. Leaves iOS unserved.                                                                   |
| `svh` / `lvh` / `dvh`                         | both           | None track the keyboard on iOS, which shifts the visual viewport without shrinking the layout viewport. BUG-015 separately ruled out `dvh` here. |
| `env(safe-area-inset-*)`                      | both           | Ruled out in the ticket; probe confirms it in passing rather than spending a session on it.                                                      |
| Browser auto-scroll / `scrollIntoView`        | both           | Currently disabled by `overflow-hidden` (Cause 1). Cheapest possible fix if it proves sufficient.                                                |

**No mechanism spans both platforms except `visualViewport`.** If the
recommendation is to be single-mechanism, that is the only candidate; the
Chromium-only options can at best be a progressive enhancement on top.

### The A11Y-019 / BUG-012 constraint has a clean answer

The ticket warns that BUG-012 was caused by reacting to viewport changes with
state, and that A11Y-019's `inert`/pan model must not be disturbed. Both are
avoidable: a `visualViewport` listener can write a CSS custom property
(`--keyboard-inset`) straight onto `document.documentElement.style` and let CSS
consume it. No React state, no re-render, no remount — so `inert`, `tabIndex`,
`zoomedIdx`, and `autoFocusId` are all untouched, and BUG-009's remount hazard
is not re-armed. This is the shape any implementation follow-up should take.

### What the device session must still settle

Items 1 and 3 of the Outcome are pure measurement, and item 2's empirical half
(what dismisses the keyboard, whether the gesture rule behaves as reasoned)
needs a real keyboard. The instrument is built — see below — so the session is
execution, not investigation.

## Device protocol

`public/keyboard-probe.html` is a self-contained diagnostic page, unlinked from
the app and excluded from the service-worker precache (`vite.config.js`) so it
is always fetched fresh. Reach it at `/quadrants/keyboard-probe.html` — via
`npm run dev:host` over LAN, or on the deployed GitHub Pages build.

1. **Environment** — records UA, standalone vs browser, screen size, and
   feature-detects `visualViewport`, the VirtualKeyboard API, `svh`/`dvh`, and
   `env(keyboard-inset-*)`.
2. **Snapshots** — auto-captured on every keyboard open/close (visual-viewport
   height jump over 100px), plus manual captures. Answers Outcome item 1: which
   viewport moves, and by how much, before/during/after.
3. **Chain overlay** — a faithful copy of the real sizing chain (`h-svh` column
   → `flex-1 min-h-0 overflow-hidden` → 200%×200% transform-panned grid → card
   at `top: 80%`), reporting live how many px of the cell are under the
   keyboard. Two toggles: `overflow: hidden ↔ auto` (tests Cause 1) and
   `size: 100svh ↔ visualViewport` (demonstrates the candidate fix and shows
   what it costs in cell height — Outcome item 3).
4. **Focus-hold ladder** — `sync` / `timeout` / `raf` / `remount` / `keeper` /
   `preventDefault`, each reporting HELD or LOST. `remount` is the one that
   mirrors this app today; `keeper` is the candidate bridge across the gap
   between edits.
5. **Dismissal trace** — every focus, blur, and viewport event timestamped, so
   the platform Done key, tap-outside, scroll-away, and rotation can each be
   identified.
6. **Copy report** — dumps environment, snapshots, and log as JSON to paste back
   into this ticket.

Run on the smallest supported screen (iPhone SE, 375×667) as well as a current
handset, and in both Safari and installed-standalone mode. On Chromium, repeat
with `?iw=resizes-content`, `?iw=resizes-visual`, and `?iw=overlays-content`.

## Blocked

Not resolvable in this session. The Outcome requires evidence "gathered on real
devices rather than emulators"; the available access is the iOS Simulator only.

- **iOS** — the simulator runs real WebKit on a real iOS build, so
  visual-viewport geometry and the gesture rule should be faithful, and items 1
  and 3 are probably answerable there. It still does not meet the bar the ticket
  sets, so simulator numbers would need recording as provisional and confirming
  on hardware before an implementation ticket is acted on.
- **Android / Chromium** — no access of any kind. `interactive-widget`, the
  VirtualKeyboard API, and `env(keyboard-inset-*)` cannot be evaluated, so the
  per-platform recommendation the Outcome asks for cannot be completed. This is
  the hard gap.

Ticket stays in `2-doing` pending a device session.

## Working

- Re-validated every line reference in the Problem. Only
  `QuadrantCanvas.tsx:166` had drifted (now `h-svh` at :172, via BUG-015);
  corrected above rather than edited in place, so the drift stays visible.
- `grep` over `src/` + `index.html` + `vite.config.js` for `visualViewport`,
  `dvh`, `lvh`, `svh`, `interactive-widget`, `virtualKeyboard`, `env(`: only the
  `h-svh` usage and its BUG-015 comment. Confirms the "no keyboard handling
  today" baseline the ticket assumed.
- Traced the edit lifecycle through `Card.tsx` and `QuadrantCanvas.tsx`, which
  is where the two-causes finding and the `useLayoutEffect` hypothesis came
  from. This was the highest-value desk work: it converts item 2 from open-ended
  research into one hypothesis with a yes/no test.
- Built `public/keyboard-probe.html`. Added `globIgnores` for it in
  `vite.config.js` — without that it joined the precache (15 entries → 14
  after), which both bloats the offline bundle with a diagnostic and, under
  `registerType: 'prompt'`, risks a device reading a stale probe after an edit.
- No tests written: the probe is a throwaway instrument with no app logic, and
  the research deliverable is the decision, not code (same call as RSRCH-001).
  Full suite re-run regardless — 397/397 green, lint/typecheck/format clean.
