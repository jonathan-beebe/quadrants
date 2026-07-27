---
id: BUG-017
type: bug
status: open
created: 2026-07-27
---

# BUG-017: the app shell and canvas do not lock to the visible viewport

## Problem

On mobile Safari the whole page scrolls vertically, even though the quadrant
canvas is designed to be a fixed, non-scrolling surface. `App.tsx:177` sizes the
app shell with `h-screen` (`100vh`), which on iOS resolves to the large viewport
— the height the page would have with browser chrome retracted. Nothing above it
constrains height (`#root`, `body`, and `html` are all auto), so the document is
laid out at large-viewport height while the scrollport is the small viewport,
leaving the page scrollable by exactly the bottom-toolbar height. The
`overflow-hidden` on that same div does not prevent this — it clips that div's
own children, it does not stop `html` from scrolling.

Both mobile canvas states are affected. Evidence in
`__local__/images/canvas-scroll/`: `canvas-resting.PNG` / `canvas-scrolled.PNG`
show the overview grid with the app header ("Start / Stop / Continue / Change"
and Share) scrolled off the top and a band of page background exposed below the
canvas; `cell-resting.PNG` / `cell-scrolled.PNG` show the same on a zoomed cell,
with the cell's own "Stress / Done" header pushed off-screen.

The shell wraps every screen, so the canvas is where it was noticed rather than
where it is confined. The same large-viewport assumption is made independently
at four more sites inside the shell, and they interact: `Sidebar.tsx:99` (mobile
drawer, `fixed h-screen`) extends its bottom edge past the visible viewport;
`FrameworkBuilder.tsx:267` is `min-h-screen` on mobile (`fullHeight` is false
unless desktop-and-creating); `ErrorBoundary.tsx:32` is `h-screen`; and
`App.tsx:219` (`<main>`) is `overflow-y-auto`, an undeclared scroll container
that currently never scrolls only because its content happens to match its
height. There is no stated rule anywhere for which viewport any of these means.

This is the exact site BUG-015 fenced out of scope and predicted was "cosmetic
at most, not functional"
(`work/0-research/viewport-height-sizing-has-no-shared-answer.md:51-53`); the
screenshots show that prediction was wrong.

## Goal

The app shell locks to the visible viewport, so no screen scrolls the document
by accident and any scrolling that does happen is somewhere a surface
deliberately asked for it.

## Outcome

On mobile Safari at the browser's default scale, the document does not scroll on
any screen reachable inside the app shell — the canvas (both the zoomed-out
overview grid and a zoomed-in cell), the empty state, the framework builder in
both create and edit modes, the conflict dialog, and the error fallback. A
vertical drag on any of them moves nothing: headers stay on screen and no band
of page background appears below the content. This holds in standalone/home-
screen mode as well.

Scrolling still works wherever a surface needs it, and only there. Three
surfaces have a scroll contract, and each holds independently of the others:

- **The sidebar's framework list** (`<nav>` inside the `<aside>`,
  `Sidebar.tsx:129`) scrolls on its own when the list is longer than the drawer.
  The `<aside>` itself ends at the bottom of the visible viewport, so the list's
  last framework is reachable and not covered by the browser toolbar, and
  scrolling the list moves nothing else.
- **The framework picker's template list** (`FrameworkBuilder.tsx:140`, shared
  by the mobile popover and the desktop column) scrolls on its own down to its
  last template, on both mobile and desktop, and scrolling it moves nothing
  else. On mobile the popover that holds it fits within the visible viewport.
- **The canvas does not scroll at all** — neither the overview grid nor a zoomed
  cell, by any gesture, in any direction.

No other surface gains a scrollbar it did not have before; in particular the
scroll removed from the document does not reappear inside `<main>`.

Pinch-to-zoom still works and a pinch-zoomed user can still pan the page to
reach content outside the visual viewport.

BUG-015's guarantee holds: the zoomed cell's footer controls remain fully
visible and tappable above the bottom toolbar, and the canvas still measures the
same in overview and zoomed states with no card position shift across the
transition. A11Y-019 holds: the three off-screen quadrants stay absent from the
accessibility tree while zoomed. BUG-003's guarantee holds: on desktop the
create-mode template list still runs to the bottom edge of the viewport and
scrolls internally. Desktop layout and behavior are otherwise unchanged. The
test suite passes.

## Why it matters

The canvas is a spatial surface — an item's meaning is its position within the
quadrant. A page that slides under the user's finger undermines that directly: a
drag intended to reposition a card can instead scroll the document, and the
fixed frame the whole zoom/pan model assumes stops being fixed.

It also silently re-opens BUG-015 — scrolling walks the canvas bottom back under
Safari's toolbar, putting the Add button and the color swatch right back under
the chrome that ticket just cleared them from.

This is default mobile Safari with no unusual configuration, on the platform the
app most explicitly targets.

Fixing it only at the canvas would leave the shell still claiming a viewport it
does not have, which is what produced this bug in the first place: BUG-015
corrected one screen and the defect resurfaced one layer up. Every surface
inside the shell inherits the same wrong assumption, so the correction belongs
where the assumption is made.

## Discovery notes

Advisory. Root cause was traced by reading, not verified on device — confirm on
the simulator before and after.

The mismatch is `App.tsx:177` (`h-screen`) against `QuadrantCanvas.tsx:172`
(`h-svh`). The shell is the only element contributing document flow height:
`Sidebar.tsx:99` is `fixed` and both toasts are `fixed`, so none of them add to
the scroll height. That makes the shell the single lead worth opening on, and
`QuadrantCanvas`'s `h-svh` may become redundant once the shell is correct —
worth checking rather than assuming.

**Watch for the scroll relocating rather than disappearing.** This is the main
hazard in the widened scope. `<main>` (`App.tsx:219`) is `overflow-y-auto`, and
two of its children assert the large viewport on their own:
`FrameworkBuilder.tsx:267` (`min-h-screen` on mobile) and `ErrorBoundary.tsx:32`
(`h-screen`). Today those match the shell's height so nothing scrolls inside
`<main>`. Shrink the shell to the visible viewport without reconciling them and
each becomes taller than `<main>`, moving the same toolbar-height slop from the
document into an internal scrollbar — the symptom looks fixed on the canvas
while the builder still scrolls. Check both, and check the conflict dialog and
empty state the same way.

`FrameworkBuilder` needs care in particular: its `fullHeight` flag at line 264
is BUG-003's decision and the desktop `h-screen` branch must keep working. It is
the mobile `min-h-screen` branch that is in question.

The three scroll regions in the outcome are already there and are not the
problem — `Sidebar.tsx:129` and `FrameworkBuilder.tsx:140` both scroll on their
own today. What is worth checking is whether they still resolve to the right
height once their ancestors change, since each is `flex-1 min-h-0` and inherits
its size from a chain that this ticket edits.

One more large-viewport unit sits in that chain: the mobile picker popover at
`FrameworkBuilder.tsx:305` is capped `max-h-[60vh]`, so on mobile it is sized
against a viewport taller than the one the user has. Whether that overflows in
practice was not measured — worth a look while the surrounding heights are being
reconciled, and it may want the same treatment as the rest.

Two mechanisms are in play and it is worth separating them. One is which
viewport a surface means — BUG-015 already argued `svh` over `dvh` for the
canvas, and the same reasoning about mid-interaction resize applies to anything
wrapping it. The other is that nothing currently declares the document itself
non-scrolling; `overflow-hidden` on a descendant of `body` does not do that. A
fix for the first may or may not be sufficient on its own.

Given the number of sites, a shared expression of "how tall is the usable
viewport" may be worth more than five independent edits — that is the question
`work/0-research/viewport-height-sizing-has-no-shared-answer.md` was filed to
settle. Deciding it here is in scope if it falls out naturally; opening the
whole research question is not.

`DesignSystem.tsx:460` (`min-h-screen`) is deliberately excluded. `App.tsx:170`
returns it before the shell, so it is not inside it, and it is a long gallery
page whose document scroll is correct. Flagging it because "the app shell" could
be read to include it.

Constraints worth holding:

- Anything that disables pinch-zoom or pan-while-zoomed fails WCAG SC 1.4.4
  Resize Text and SC 1.4.10 Reflow. `user-scalable=no` and a blanket
  `touch-action: none` are both out on those grounds — and per `index.css:141`,
  iOS ignores `user-scalable=no` for pinch anyway.
- `overscroll-behavior` addresses rubber-banding and scroll chaining, not a page
  that is genuinely taller than its scrollport. Probably not the lever, though
  it may be a useful finishing touch.
- If `position: fixed` on the shell or body is considered, read RSRCH-002 lines
  301-313 first: it measured iOS scrolling the visual viewport itself with the
  keyboard up, and found a `position: fixed` container loses content at both
  ends when that happens.
- BUG-015's no-reflow constraint from 4996ae3 still binds: the canvas must
  measure the same in overview and zoomed states.
- A locked shell means an on-screen keyboard can no longer be escaped by
  scrolling the page. That is RSRCH-002's territory and it is open — avoid
  foreclosing its options, and see `useVisualViewportHeight.ts` for the signal
  it established.
- Desktop is unaffected (`vh` and the visible viewport agree there); whatever
  changes should be verified as a no-op on desktop.

On testability: as BUG-003 and BUG-015 both found, jsdom computes no layout and
loads no Tailwind, so scroll height is not unit-testable and asserting class
name strings is the class-pinning both tickets rule out. Expect validation to be
visual on device, with the existing suite as the regression guard for the
A11Y-019, BUG-003 and desktop-unchanged clauses. If a behavioral seam does
emerge, prefer it — but do not manufacture one.

## Related work

- BUG-015 — same root cause (`vh` = large viewport), fixed for the canvas at
  `QuadrantCanvas.tsx:172` (`h-svh`) but explicitly fenced to that chain,
  leaving `App.tsx:177` untouched. Its working notes assert "the page is
  `overflow-hidden` and never scrolls, so mobile Safari keeps the toolbar
  expanded" — this ticket is the counter-evidence to that premise.
- `work/0-research/viewport-height-sizing-has-no-shared-answer.md` — standing
  research candidate that named `App.tsx:177` and judged it cosmetic. Its "What
  is actually still broken" section needs correcting if it is ever promoted. It
  also predicted the `Sidebar.tsx:99` drawer problem this ticket now covers.
- BUG-003 — introduced the deliberate desktop `h-screen` at
  `FrameworkBuilder.tsx:267` and its `fullHeight` flag; in scope now, and its
  desktop guarantee must survive.
- IMPRV-002, A11Y-016, IMPRV-005 — the responsive master-detail template picker,
  its mobile popover semantics, and its arrow-key navigation. They own the
  template list whose independent scroll is now an outcome clause.
- BUG-016 — the adjacent iOS layout-viewport defect (sub-16px controls trigger
  auto-zoom); established the project's position against `user-scalable=no`
  (`index.css:124-141`).
- RSRCH-002 (open, `2-doing`) — on-screen keyboard vs. viewport. Its "Cause 1"
  turns on whether the canvas has a scrollable ancestor, so any scroll-locking
  mechanism chosen here constrains its solution space.
- A11Y-019 — the zoom/pan model and off-screen-quadrant AT guarantee.
- A11Y-005, BUG-012, BUG-013, BUG-014 — the mobile drawer's focus, modality and
  breakpoint behavior, which resizing `Sidebar.tsx:99` must not disturb.
- bc63326 / 4996ae3 — the `h-svh` fix and the absolutely-positioned
  header/footer overlays that keep canvas size constant across zoom.

## Working

- **Root cause confirmed as stated.** `App.tsx:177` was
  `flex h-screen overflow-hidden`. `#root`, `body` and `html` are all
  auto-height, so the document took the shell's large-viewport height while the
  scrollport stayed the small viewport, and `html` scrolled by the difference.
  The `overflow-hidden` on the shell was never relevant to this — it clips the
  shell's own children and says nothing about the document.
- **No `html`/`body` overflow lock was needed, and adding one would have been
  wrong.** The obvious reach is `html, body { overflow: hidden }`, but
  `DesignSystem` renders on App's early return _outside_ the shell and is a long
  gallery page that must keep scrolling. Sizing the shell to `svh` removes the
  overflow at its source instead: body content is then never taller than the
  scrollport, so there is nothing to scroll and nothing to suppress. Simpler,
  and it leaves the design system alone.
- **The ticket's relocation hazard was real.** With the shell at `svh`,
  `FrameworkBuilder`'s `min-h-screen` and `ErrorBoundary`'s `h-screen` would
  each have become taller than `<main>`, moving the same toolbar-height slop
  into `<main>`'s existing `overflow-y-auto`. The canvas would have looked fixed
  while the builder still scrolled. Both are now sized against their container.
- **`ErrorBoundary` took `h-svh`, not `h-full`.** It renders in two positions —
  inside `<main>` (`App.tsx:237`) and at the root wrapping `<App>`
  (`main.tsx:9`). In the root position `#root` has no definite height, so a
  percentage would collapse. `svh` is correct in both and equals the shell's
  height in the first, so it adds no scroll.
- **`QuadrantCanvas` moved from `h-svh` to `h-full`.** Checked rather than
  assumed, as the ticket asked. Both compute to the same height now, but two
  independent claims on the viewport is precisely what this bug was, so the
  canvas defers to the shell and the shell states it once.
- **The picker popover cap went `60vh` → `60svh`** (`FrameworkBuilder.tsx:311`).
  Whether it actually overflowed was never measured and still has not been — the
  change is for consistency with the invariant, not a fix for an observed
  symptom.
- **Test written, and it is not class-pinning.**
  `src/__tests__/ viewportLock.test.ts` asserts the _absence_ of large-viewport
  units (`h-screen`, `min-/max-h-screen`, raw `Nvh`) across `App.tsx` and every
  component inside the shell, with `DesignSystem` exempted by position and the
  reason recorded next to the exemption. It fails on the pre-fix tree with all
  six offenders named. This is the shape `touchZoom.test.ts` (BUG-016) already
  established for CSS invariants jsdom cannot render, so it is an existing
  pattern rather than a new one — and it guards the recurrence directly, which
  matters here because BUG-015 fixed one screen and the same cause resurfaced
  one layer up.
- Comment text is stripped before scanning, so `QuadrantCanvas`'s prose about
  `vh` and `h-screen` is not a false hit.
- **Verified the utilities actually emit.** Built and grepped `dist`:
  `.h-svh{height:100svh}`, `.h-full{height:100%}`,
  `.min-h-full{min-height:100%}`, `.max-h-\[60svh\]{max-height:60svh}`. Worth
  doing because a silently-dropped utility would look identical to a working fix
  in every test available here. One `.max-h-\[60vh\]` rule survives in the
  bundle: Tailwind v4 scans `work/ *.md` and picked the candidate out of this
  ticket's own prose. Dead rule, no element carries the class.
- Suite green at 444/444, typecheck, lint and format clean.
- **Not verified on device — this is the outstanding item.** Every pixel claim
  in the outcome needs a simulator run: no document scroll on each screen, the
  drawer's last entry reachable, the builder scrolling only when its form
  genuinely outgrows `<main>` (likeliest on a short phone in create mode, where
  the picker trigger adds ~90px), and pinch-zoom panning still working.
  Pinch-zoom pan is expected to be unaffected — it pans the visual viewport,
  which is independent of document scroll — but that is reasoning, not evidence.
- **`overscroll-behavior` deliberately not added.** The reported defect is
  persistent scroll, which is fixed at its source. iOS rubber-band bounce is a
  different mechanism and, if it shows on device, is a one-line follow-up rather
  than something to add speculatively now.
