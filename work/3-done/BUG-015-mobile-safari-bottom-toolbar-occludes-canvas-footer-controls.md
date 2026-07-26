---
id: BUG-015
type: bug
status: resolved
created: 2026-07-26
---

# BUG-015: mobile safari bottom toolbar occludes the quadrant canvas footer controls

## Problem

On mobile Safari the bottom edge of the quadrant canvas renders underneath the
browser's floating bottom toolbar. `QuadrantCanvas.tsx:166` sizes the whole
canvas with `h-screen` (`100vh`), which resolves to the large viewport — the
height the page would have with browser chrome retracted — so the canvas bottom
sits behind chrome that is actually on screen. Two things land in that dead
strip. In overview, the bottom-row quadrant labels ("Eliminate", "Delegate") are
covered and readable only in the gaps either side of the URL pill. In the zoomed
state, the cell's footer bar (`MobileQuadrantGrid.tsx:169-180` —
`absolute bottom-0`, holding the ColorPicker swatch and the Add button) is
almost entirely covered, leaving a few pixels of "Add +" visible; because the
toolbar takes the touch, the control is not merely hard to see but effectively
untappable. Evidence:
`__local__/images/safari-chrome-blocking-canvas/viewing-grid.png` and
`zoomed-on-one-cell.png`, captured on the iOS simulator.

## Goal

The mobile quadrant canvas ends at the bottom of the viewport the user can
actually see, so nothing the app draws lands under the browser's bottom chrome.

## Outcome

On mobile Safari with the bottom toolbar shown, the zoomed cell's footer
controls — the color swatch and the Add button — are fully visible and can be
tapped, and the bottom-row quadrant labels in the overview state are fully
legible. The same holds in standalone/home-screen mode, where the controls also
clear the home indicator. The zoom transition still produces no card position
shift between overview and zoomed states, and the canvas measures the same in
both. A11Y-019's guarantee holds: the three off-screen quadrants remain absent
from the accessibility tree while zoomed. Desktop layout is unchanged. The test
suite passes.

## Why it matters

Adding an item is the core interaction of the app, and on the platform the app
most explicitly targets it is sitting under the browser's own toolbar — a user
who zooms into a quadrant to add something cannot reach the button that does it.
The overview labels are the only thing naming the bottom two quadrants, so the
overview also loses information. This is the default state of mobile Safari with
no unusual configuration, not an edge case.

## Discovery notes

Advisory; none of this is verified beyond the simulator screenshots.

Likely root cause is the `vh` unit resolving to the large viewport at
`QuadrantCanvas.tsx:166`. The small-viewport unit (`100svh`) is the obvious
lead, and `dvh` is worth a look, though a dynamic unit that changes as the
toolbar retracts may fight the no-reflow constraint below.

The home-indicator half of the problem is a different mechanism from the toolbar
half. Safe-area insets do not describe browser chrome, so an inset alone will
not solve the Safari case; conversely a viewport unit alone will not clear the
home indicator in standalone mode. Note that `index.html:5` is
`width=device-width, initial-scale=1.0` with no `viewport-fit=cover`, so
`env(safe-area-inset-*)` currently resolves to `0` throughout the app — anything
depending on insets needs that enabled first, and enabling it changes layout
app-wide, not just on this screen.

Measure before combining the two. These captures are from a recent
floating-toolbar Safari, and how `safe-area-inset-bottom` reports against that
floating bar has changed across iOS versions; a viewport unit plus an inset may
double-count and leave a visible dead gap. The simulator is already set up for
this check, and it is worth confirming in both Safari and standalone mode since
they may differ.

Hard constraint from commit 4996ae3: the footer is an absolutely-positioned
overlay on purpose, so the canvas is always `flex-1` and its size never changes
between overview and zoomed states. Returning it to normal flow would
reintroduce the card-position shift during zoom that the commit removed.
Whatever gives the footer clearance should preserve that property.

Scope was decided during scoping as the mobile canvas chain only —
`QuadrantCanvas.tsx:166` and the `MobileQuadrantGrid` footer. The other
`h-screen` usages (`App.tsx:177`, `Sidebar.tsx:99`, `FrameworkBuilder.tsx:267`,
`ErrorBoundary.tsx:32`, `DesignSystem.tsx:257`) are deliberately untouched;
`FrameworkBuilder`'s in particular is BUG-003's decision.

On accessibility framing: the occluder here is user-agent chrome rather than
author-created content, so this is not cleanly a failure of SC 2.4.11 Focus Not
Obscured or SC 2.5.8 Target Size, both of which are scoped to author content.
Treat it as a functional defect and avoid citing a specific SC that does not
apply.

As BUG-003 found for the equivalent desktop problem, jsdom computes no layout,
so the pixel outcome is not unit-testable — validation is likely visual on
device plus keeping the existing suite green. Avoid pinning class names in
tests.

## Related work

- BUG-003 — the desktop counterpart of viewport-height sizing; it deliberately
  introduced `h-screen` at `FrameworkBuilder.tsx:267` gated to
  `!editing && !isMobile`, which is why that usage is out of scope here
- A11Y-019 — the zoom/pan model and the off-screen-quadrant AT guarantee that
  any repositioning must not disturb
- A11Y-001 — inert non-focused mobile quadrant canvases
- RSRCH-002 (open) — the keyboard-occlusion research; whatever this ticket lands
  on becomes the baseline it measures against
- 4996ae3 — made the mobile header and footer absolutely positioned overlays
  specifically so the canvas size never changes between overview and zoomed
  states
- ea8f1dd — prevented layout reflow jitter during the zoom animation
- c7bffeb — wired up `MobileQuadrantGrid`

## Working

- Root cause confirmed as stated: `QuadrantCanvas.tsx:166` was `h-screen`
  (`100vh` → large viewport). The fix is a one-word unit change to `h-svh`
  (Tailwind 4.3 ships the `svh` utilities natively). Both symptoms share that
  one cause — the zoomed cell's footer and the overview's bottom-row labels are
  each pinned to `bottom-0` of a box whose bottom edge is the canvas bottom, so
  raising the canvas bottom into the visible viewport lifts both.
- Chose `svh` over `dvh` deliberately. `dvh` tracks chrome as it retracts, which
  would resize the canvas mid-interaction and reintroduce exactly the card
  position shift 4996ae3 removed. `svh` is static, so the no-reflow guarantee in
  the outcome holds. The cost of `svh` (unused space when chrome retracts) is
  nil here: the page is `overflow-hidden` and never scrolls, so mobile Safari
  keeps the toolbar expanded and `svh` is the visible height at all times.
- **Did not add `viewport-fit=cover`.** The ticket anticipated needing it for
  the home indicator, but that was based on a wrong premise. `viewport-fit`
  defaults to `auto`, under which iOS already lays the page out inside the safe
  area — so in standalone mode the home indicator is clear today, with no
  `env()` involved. Adding `cover` would have _created_ the home-indicator
  problem and then required insets to solve it, for no gain and with app-wide
  reach. This also dissolves the ticket's open question about `svh` and the
  inset double-counting: only one mechanism is in play, so they cannot
  double-count.
- No new automated test, per the ticket's own guidance and the codebase
  convention. The change is a CSS unit; jsdom computes no layout and loads no
  Tailwind, so the only assertion available is `className` string matching —
  which is the class-pinning the ticket rules out, and which no existing test in
  `QuadrantCanvas.test.tsx` or `MobileQuadrantGrid.test.tsx` does. The existing
  397 tests stand as the regression guard for the outcome's "A11Y-019 still
  holds" and "desktop unchanged" clauses; the pixel outcome is visual on device.
- Suite green at 397/397, typecheck and lint clean, before and after.
- Left in scope-fenced state as agreed: `App.tsx:177` (app shell) and
  `Sidebar.tsx:99` (mobile drawer) are still `h-screen` and so still extend
  behind the toolbar on mobile. The shell is harmless — it is `overflow-hidden`
  and the canvas now determines the visible bottom edge, so at most a strip of
  page background sits behind the floating toolbar. The drawer is a real but
  separate instance of the same cause. Filed as a research candidate in
  `0-research` rather than widened into this ticket.
- **Verified on device.** Human confirmed the fix on the iOS simulator. The
  ticket's open risk did not materialize: the recent floating-toolbar Safari
  does exclude that bar from `svh`, so the viewport unit alone is sufficient and
  the safe-area fallback was not needed. `viewport-fit=cover` stays out of the
  codebase.
