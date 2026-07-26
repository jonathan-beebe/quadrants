---
id: BUG-014
type: bug
status: resolved
created: 2026-07-26
resolved: 2026-07-26
---

# BUG-014: mobile drawer stays open over the screen its own actions navigate to

## Problem

On mobile the sidebar drawer is modal — backdrop, focus trap, and `<main>` is
inert (`Sidebar.tsx:51,84-98`; `App.tsx:180`) — but none of the drawer's actions
dismiss it. `App.tsx:170-175` wires `onSelect` (navigate), `onNew`
(openBuilder), `onImport`, and `onDuplicate` straight through without touching
`sidebarOpen`. Every one of them changes what `<main>` renders, so the user's
chosen screen is drawn behind a dim overlay, inert and unreachable, while focus
stays trapped in the drawer. "+ New Framework" is the most visible case: the
builder screen opens underneath the still-open nav.

## Goal

Choosing an action in the mobile drawer takes the user to the screen they asked
for, with nothing left covering it.

## Outcome

On mobile, selecting a framework, choosing "+ New Framework", choosing Import,
or choosing Duplicate from a framework's actions menu leaves the drawer closed,
the backdrop gone, `<main>` no longer inert, and keyboard focus on the revealed
screen rather than on the stale trigger inside the dismissed drawer. On desktop
the sidebar's open state is unchanged by these actions. Both the
mobile-dismisses and desktop-unaffected cases are covered by tests.

## Why it matters

The primary mobile navigation path is broken — the user acts and appears to get
no response, because the result is hidden behind the drawer they just used. For
keyboard and AT users it is worse than cosmetic: focus is trapped in a drawer
whose purpose is spent, and the content they navigated to is removed from the
accessibility tree by `inert` (WCAG 2.4.3 Focus Order).

## Discovery notes

Advisory. All four handlers are one-liners at `App.tsx:170-175`; the drawer
itself already has `onToggle`. Whether the dismissal belongs in App's handlers
or inside `Sidebar` is the maker's call — App owns `sidebarOpen`, so wrapping
there is likely simplest, but note `openBuilder` / `handleDuplicate` /
`handleImport` are `useCallback`-memoized. Guard on `isMobile` so the desktop
permanent sidebar is untouched.

Focus restore is the subtle part: A11Y-005's cleanup effect
(`Sidebar.tsx:60-68`) refocuses `previouslyFocusedRef` on close, which after a
navigation points at a button that no longer exists — worth checking where focus
actually lands. BUG-013 established that every mobile screen renders its own
sidebar opener in its title row, which may be the natural landing target.

Import opens an OS file picker, so its dismissal timing may read differently
than the others. Existing coverage lives in `src/__tests__/Sidebar.test.tsx` and
`App.test.tsx`.

## Related work

- A11Y-005 — introduced the modal drawer (focus trap, Escape, inert main) whose
  open-time behavior must be preserved
- BUG-012 — render-time breakpoint sync of `sidebarOpen`; the same state is at
  issue
- BUG-013 — each mobile screen carries its own opener; the focus-restore target
  after a navigation
- BUG-005
- A11Y-004
- A11Y-016

## Working

- Re-validated: root cause is exactly as scoped. `onSelect` / `onNew` /
  `onDuplicate` / `onImport` all changed `<main>` without touching
  `sidebarOpen`, so on mobile the modal drawer stayed over the new screen.
- Took the ticket's suggestion and wrapped the four handlers in `App` (which
  owns `sidebarOpen`) rather than moving dismissal into `Sidebar`. The wrappers
  are inline arrows in the JSX, matching the existing `onToggle` there; the
  memoized callbacks are called from inside them, so their identity is
  untouched.
- Confirmed the stale-focus concern was real. Every navigation remounts the
  screen — `onSelect` too, because `<ErrorBoundary key={activeFramework.id}>`
  re-keys — so A11Y-005's restore-focus cleanup always refocused a detached node
  and left focus on `<body>`.
- Landed focus on `<main>` (now `tabIndex={-1}`) rather than the revealed
  screen's own opener, which the ticket floated as an option: it needs no ref
  plumbed through the three screens that render `SidebarToggleButton`, it is the
  standard SPA route-change focus target, and Tab from there reaches that opener
  as the first control anyway. It also gives the existing `#main-content` skip
  link a properly focusable target.
- Focus is moved in an effect, not in the handler: `<main>` is still `inert`
  when the handler runs, and focusing an inert element is a no-op. The effect
  also runs after `Sidebar`'s cleanup (child effects commit before parent), so
  it deterministically wins the race against A11Y-005's restore.
- Import dismisses immediately rather than on a successful pick. The file picker
  is opened by a detached input (`io.ts:13-31`) with no reliable cancel signal
  on all browsers, and the ticket's outcome is that choosing Import leaves the
  drawer closed. Cost: cancelling the picker returns you to the screen, not the
  drawer.
- Desktop is untouched — `dismissDrawer` early-returns when `!isMobile`; covered
  by two desktop tests.
- 7 new tests in `App.test.tsx` (5 mobile dismissal + focus landing + 2 desktop
  no-op); all 6 mobile-facing ones failed against the old code first. Suite
  397/397 green, lint and typecheck clean.
- Noted for follow-up: focus ownership for the drawer is now split across `App`
  (state, `inert`, post-navigation focus) and `Sidebar` (modal semantics, trap,
  restore) — the comment in `App.tsx` documents which one must win. That split
  is the sixth ticket on this surface; filed as research for the human to weigh.
