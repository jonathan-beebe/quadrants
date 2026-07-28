---
id: RFCTR-008
type: refactor
status: open
created: 2026-07-27
---

# RFCTR-008: consolidate mobile drawer focus and modality under one owner

## Problem

Responsibility for the mobile sidebar drawer's focus and modality is split
across two components with no stated contract between them. `Sidebar.tsx` owns
the modal semantics — the `isModal` derivation (`Sidebar.tsx:51`), focus-on-open
and restore-focus-on-close (`Sidebar.tsx:58-68`), the focus trap and
Escape-to-close (`Sidebar.tsx:70`), and `role="dialog"` / `aria-modal`
(`Sidebar.tsx:95-96`). `App.tsx` owns the state that modality is derived from
(`App.tsx:43`), the render-time breakpoint re-sync (`App.tsx:45-55`), `inert` on
`<main>` (`App.tsx:225`), and the post-navigation focus landing
(`App.tsx:150-170`).

The two now compete for the same resource. Both write `document.activeElement`
on the commit where a drawer action navigates, and BUG-014's fix is correct only
because parent effects commit after child effects, so `App`'s `mainRef.focus()`
overwrites `Sidebar`'s restore of a node the navigation already detached. That
ordering is load-bearing and invisible; it survives only as the comment at
`App.tsx:167-168`. BUG-012 hit the same class of problem from the other side and
was solved by moving work out of effects into render.

One side of that race is unverified: `Sidebar.test.tsx:208` asserts
focus-on-open and `App.test.tsx:230` asserts the post-navigation landing, but no
test asserts that a plain Escape or backdrop dismiss returns focus to the
opener. If `Sidebar`'s restore stopped working, the suite would stay green.

## Goal

The drawer's focus behavior is guaranteed by a single owner rather than by an
undocumented ordering race between two.

## Outcome

Dismissing the mobile drawer lands focus in one predictable place per dismissal
path — the revealed screen after a drawer action navigates, the opener after a
plain Escape or backdrop dismiss — and both paths are covered by tests, the
restore path for the first time. No part of that guarantee depends on the
relative commit order of two components' effects, and the correctness of the
drawer's focus behavior can be established by reading one place. The rule for
where a modal surface's focus and background-`inert` responsibilities live is
discoverable in `src/architecture.md`, which `CLAUDE.md` names as the home for
recorded decisions and which currently says nothing about modality. All existing
drawer behavior — A11Y-005's open-time modal semantics, BUG-012's breakpoint
re-sync, BUG-014's dismissal on navigation, and the untouched desktop sidebar —
is preserved.

## Why it matters

This surface has taken two ownership-split defects in six weeks (BUG-012,
BUG-014), and each was diagnosed by rediscovering the effect-ordering rule from
scratch. The current arrangement is correct but fragile in a specific way: its
correctness rests on a React commit-order detail recorded in a single comment,
with no test guarding one side of it. A focus regression here is a WCAG 2.4.3
Focus Order failure on the app's primary mobile navigation path, and the
cheapest moment to remove the fragility is before the next ticket touches the
surface rather than during it.

## Discovery notes

Advisory — `/work-start` may use or discard.

- The single owner probably cannot be `Sidebar`. Two of the four
  responsibilities target nodes `Sidebar` does not render (`inert` on `<main>`,
  and the post-navigation focus landing, both `App.tsx`), and `sidebarOpen` also
  drives the desktop layout margin at `App.tsx:226` and reaches three screens as
  a prop. That points at `App`, or something `App` calls, rather than at pushing
  state down.
- One shape worth weighing: a coordination hook (`src/hooks/` is the
  Coordination layer per `architecture.md:47`, already home to `useFocusTrap`,
  `useClickOutside`, `useIsMobile`) that owns open state, the breakpoint
  re-sync, the `inert` decision, and a single focus-on-close decision made from
  data — was this close caused by a navigation, or by a plain dismiss? — leaving
  `Sidebar` presentational. If that shape holds, the ordering comment can be
  deleted rather than restated, because there is no second party to order
  against.
- Consider writing the missing restore-on-dismiss test against current code
  first, where it should pass. It is the behavior most likely to be disturbed
  and is currently unguarded.
- Roughly 15 existing tests already pin the outcomes behaviorally and should
  carry through unchanged: 4 from A11Y-005 (`Sidebar.test.tsx:205-232`), 2 from
  BUG-012 (`App.test.tsx:37,53`), and 7 from BUG-014 (`App.test.tsx:145-270`).
- A general modal-surface primitive was considered and is **not** proposed here.
  There are four `aria-modal` surfaces (`Sidebar.tsx:95`,
  `ConflictDialog.tsx:30`, `EditModal.tsx:67`, `FrameworkBuilder.tsx:308`) and
  they differ in ways a shared abstraction would have to parameterize away: the
  drawer inerts a sibling, `ConflictDialog` is inerted by a wrapper div
  (`App.tsx:185`), `EditModal` inerts nothing, the picker is a click-outside
  popover. Naming the contract in `architecture.md` is the cheaper half; revisit
  the abstraction when a third surface needs to inert something outside itself.
- Out of scope, noted while researching: `ConflictDialog` and `EditModal` do not
  restore focus on close at all (WCAG 2.4.3). Separate defects, worth their own
  tickets; `EditModal`'s is latent because only `DesignSystem` renders it today,
  but RSRCH-002 is expected to wire it into the mobile edit path.

## Related work

- Research candidate:
  `work/0-research/mobile-drawer-focus-ownership-split-across-app-and-sidebar.md`
  — origin of this ticket; holds the full findings, including why only 2 of the
  7 tickets on this file are ownership defects
- BUG-014 — introduced the post-navigation focus landing and the ordering
  comment this ticket removes
- BUG-012 — render-time breakpoint re-sync of `sidebarOpen`; same state, and
  precedent for solving this class by restructuring rather than by adding an
  effect
- A11Y-005 — introduced the modal drawer (focus trap, Escape, restore, inert
  main); its open-time behavior must be preserved
- BUG-013 — each mobile screen carries its own opener, the focus-restore target
  after a dismiss
- RSRCH-002 — will wire `EditModal` into the mobile edit path, which is when the
  out-of-scope focus-restore gap above becomes user-facing

## Working

- Re-validated: the split was exactly as scoped, and the restore half was
  confirmed unguarded — no test anywhere asserted that a non-navigating dismiss
  returns focus to the opener.
- Wrote that missing coverage first, at App level rather than in
  `Sidebar.test.tsx`, since the behavior was about to stop being Sidebar's.
  Three tests (Escape, close button, backdrop), all green against the old code,
  so they characterize rather than drive. The backdrop one uses `fireEvent`, not
  `userEvent`: a full click would additionally apply the browser's own
  click-target focus default (jsdom: `body`), which is pointer behavior rather
  than anything the dismissal path decides — the distinction A11Y-016 drew.
- Landed `src/hooks/useDrawerModality.ts` as the single owner: open state, the
  BUG-012 render-time breakpoint re-sync, `isModal`, and both focus moves. It
  returns `closeButtonRef` and `mainRef` for `App` to attach. `Sidebar` now
  receives `isModal` and `closeButtonRef` as props and derives nothing about its
  own modality; it keeps `useIsMobile` only for the desktop floating opener,
  which is a layout affordance rather than a modality question.
- The ordering comment at `App.tsx:167-168` is deleted rather than restated.
  With one writer there is no order to depend on: closing resolves to one target
  chosen from `closedByNavigationRef` — `<main>` when a drawer action navigated,
  the opener otherwise.
- **Behavior change worth flagging.** The opener is now captured in the toggle
  handler instead of in an effect after commit. Inerting a subtree that contains
  the focused element blurs it, so by the time the old effect read
  `document.activeElement` a real browser had already moved focus to `<body>` —
  meaning the restore this ticket set out to preserve was probably already
  broken outside jsdom, which implements no such blur. Capturing before the
  commit fixes that. It is not verified on a device; jsdom cannot show the
  difference, and both versions pass the same three tests.
- Recorded the decision in `src/architecture.md` — a row in Accepted decisions
  plus a short "Modal surfaces" subsection stating the rule (whatever owns the
  open state owns the focus moves that follow), why `useFocusTrap` stays
  narrower, and that the two missing focus restores are a known gap rather than
  a pattern to copy.
- Test churn was confined to `Sidebar.test.tsx` prop wiring: `isModal: false` in
  `defaultProps`, `isModal={true}` on the three modal cases. Its focus-on-open
  test moved to `App.test.tsx` rather than being deleted, since the behavior
  moved with it.
- Suite 447/447 green, lint and typecheck clean. The ~15 tests the ticket
  expected to carry through did, unmodified apart from those props.
- Not done here, as scoped: the missing focus restores in `ConflictDialog` and
  `EditModal` (WCAG 2.4.3). Still unfiled.
