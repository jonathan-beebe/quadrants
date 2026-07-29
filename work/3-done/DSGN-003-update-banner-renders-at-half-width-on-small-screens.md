---
id: DSGN-003
type: design
status: resolved
created: 2026-07-29
---

# DSGN-003: update banner renders at half width and wraps on small screens

## Problem

On small screens the update banner renders at roughly half the viewport width,
wrapping "A new version is available." onto three lines while wide empty margins
sit either side. `src/components/UpdateToast.tsx:59` places the toast with
`fixed bottom-5 left-1/2 -translate-x-1/2`, and `UpdateToastView` (`:15`) gives
it `max-w-md` and no width of its own. A shrink-to-fit fixed box anchored at
`left: 50%` can only draw on the 50% of the viewport to its right, so at a 430pt
phone width its widest possible layout is ~215px — the 448px `max-w-md` cap
never engages. Evidence:
`__local__/images/issues/upgrad-banner-feels-squished.PNG`. The error toast
(`src/components/Toast.tsx:12`) is positioned identically.

## Goal

The update banner presents its message on a comfortable measure at every screen
width, sized by the space actually available rather than by an artifact of how
it is centered.

## Outcome

On a ~430px-wide viewport the update banner's message reads on one line (two at
most), and the banner occupies the width available to it — up to the full width
of the small-screen container — rather than ~half the viewport. On wide
viewports it stays centered and stops short of an uncomfortably long reading
measure. In both cases the message, Reload, and Dismiss stay on a single row,
the dismiss control keeps its 24x24 hit area, and the banner keeps announcing
once as a polite status. The error toast reads as a sibling of it, not a
differently-shaped thing.

## Why it matters

This banner is the app's only channel for telling someone a new version is
waiting, and on mobile — the platform this PWA most targets — it arrives as a
cramped three-line block that reads like broken chrome rather than a system
notice. A seven-word sentence wrapped three ways beside half a screen of empty
space undercuts the notice's credibility and makes Reload easy to dismiss as
noise. At ~215px the row also has almost no slack left before the message column
starts colliding with the two controls.

## Discovery notes

Advisory.

Design layer — the questions worth settling before any CSS:

- A toast at phone width is a full-bleed strip with an edge gutter, not a
  centered pill. The user has already accepted full-width on small screens; the
  open decision is the gutter, and whether it matches the app's existing edge
  rhythm (`px-3`/`px-4` elsewhere).
- Reading measure is the constraint at the other end: unbounded width on a
  desktop monitor is as wrong as 215px on a phone. Whatever replaces `max-w-md`
  should still cap the line length somewhere comfortable.
- Message, action, and dismiss on one row is the shape worth preserving — the
  wrap is the symptom, and a fix that keeps the box narrow but stacks the
  controls would trade one awkward layout for another.
- Both toasts should resolve to the same presentation rule. They are the same
  component class wearing different colors, and A11Y-017 already had to fix them
  as a pair.

Mechanism lead (take or discard): the ~215px ceiling is what `left: 50%` does to
a shrink-to-fit fixed element — the available width for the box becomes the
distance from its containing-block left edge to the viewport's right edge. Any
approach that gives the box a real width to lay out in, rather than letting it
size to content inside a half-viewport slot, dissolves it. Worth verifying on
device: the screenshot measurement (~214px of 430px CSS) is derived from the
PNG, not from a debugger.

## Related work

- [A11Y-007](../3-done/A11Y-007-update-toast-conflicting-role-and-aria-live.md)
  — this component's role/live-region semantics; must survive.
- [A11Y-017](../3-done/A11Y-017-toast-dismiss-buttons-fail-24px-target-size-floor.md)
  — 24px dismiss targets in both toasts; must survive.
- [BUG-015](../3-done/BUG-015-mobile-safari-bottom-toolbar-occludes-canvas-footer-controls.md)
  and
  [BUG-017](../3-done/BUG-017-app-shell-and-canvas-do-not-lock-to-the-visible-viewport.md)
  — the mobile bottom edge, the same edge this banner sits on.
- Filed alongside the app-shell safe-area ticket, which also governs this
  banner's bottom offset.

## Working

`types/design.md` is still `TO BE DEFINED — owner: human`, so this ticket was
worked under `types/improvement.md` (TDD) by explicit decision at session start.
The design-type workflow remains unwritten.

**Re-validated.** Both toasts still carried
`fixed bottom-5 left-1/2 -translate-x-1/2` with `max-w-md` and no width of their
own, exactly as filed. The mechanism lead was correct and is the whole defect: a
`width:auto` fixed box with only `left` set sizes to content inside the slot
from `left:50%` to the viewport's right edge, so `max-w-md` (448px) can never
engage below a 896px viewport.

**Decision — the anchor.** `left-1/2 -translate-x-1/2` → `inset-x-3 mx-auto`,
keeping `max-w-md`. Setting both `left` and `right` gives the box a real width
to lay out in; `max-width` then caps it and `margin-inline: auto` centers it
within the inset region. One rule covers both ends the ticket asked about —
full-bleed-with-gutter on a phone, capped measure on a monitor — with no
breakpoint.

**Decision — the gutter.** `inset-x-3` (12px), matching the mobile edge rhythm:
`MobileQuadrantGrid`'s corner labels and footer bar are both `px-3`, as is
`EditModal`'s `p-3`. `px-4` is the app's _interior_ padding (`Modal`,
`ModalTitleBar`, `Sidebar`); the toast keeps `px-4` inside and takes `3` at the
screen edge.

**Decision — shared rule.** Extracted `TOAST_ANCHOR_CLASSES` in `Toast.tsx`,
imported by `UpdateToast`. Only the anchor is shared; `max-w-md` stays on each
component because `UpdateToastView` renders uncentered in the design system
(`DesignSystem.tsx:680`) and would lose its cap in that preview otherwise.
Colors and the rest of the chrome stay local — factoring the full shared chrome
is a refactor beyond this ticket.

**Verified.** Measured against the built stylesheet rather than jsdom, which
does not lay out: `inset-inline: calc(var(--spacing) * 3)` = 12px,
`margin-inline: auto`, `max-width: var(--container-md)` = 448px. At a 430px
viewport the banner is 406px wide (was ~215px) — the message needs ~170px of the
~254px left after the controls, so it sets on one line. On wide viewports it
caps at 448px and stays centered.

**Left alone.** `bottom-5` is untouched; the bottom edge and safe-area insets
belong to IMPRV-013, which names this banner as one of its sites.

**Not verified on device.** The one-line claim is derived from the emitted CSS
and text metrics, not from a phone or simulator. Worth an eye on the real device
alongside IMPRV-013, since both tickets touch this same box.

**Tests.** `src/__tests__/Toast.test.tsx` (new) and a `presentation (DSGN-003)`
block in `src/__tests__/UpdateToast.test.tsx`. The update-toast mock's
`needRefresh` became mutable so the banner itself can mount — previously only
its registration side effects were covered. Tests assert the anchor, the absence
of the `left-1/2` idiom as a regression guard, the single row, and the A11Y-007
and A11Y-017 guarantees. 574 → 582 tests, all green.
