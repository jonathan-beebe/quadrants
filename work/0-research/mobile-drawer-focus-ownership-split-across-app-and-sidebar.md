---
type: research
status: candidate
created: 2026-07-26
origin: BUG-014
---

# Candidate: mobile drawer focus ownership is split across App and Sidebar

Filed automatically while working BUG-014, per `work-start/types/bug.md`. Not an
allocated ticket — no id drawn, no journal entry. For the human to promote to
`1-inbox` (via `/work-scope`) or discard.

## Why this was filed

BUG-014 is the sixth ticket on the mobile sidebar drawer: BUG-005, A11Y-004,
A11Y-005, A11Y-016, BUG-012, BUG-013. That recurrence is the signal; the
specific smell found while fixing it is below.

## The smell

Responsibility for the drawer's focus and modality is split across two
components with no stated contract between them:

- `Sidebar.tsx` owns the modal semantics — `role="dialog"`, `aria-modal`, the
  focus trap, Escape-to-close, focus-on-open, and restore-focus-on-close
  (`Sidebar.tsx:51,58-70`, from A11Y-005).
- `App.tsx` owns the state the modality is derived from (`sidebarOpen`), the
  `inert` on `<main>`, the render-time breakpoint re-sync (BUG-012), and now the
  post-navigation focus landing (BUG-014).

The two now actively compete. BUG-014's fix works because App's effect runs
after Sidebar's cleanup — parent effects commit after child effects — so App's
`mainRef.focus()` overwrites Sidebar's restore of a node the navigation had
already detached. That ordering is load-bearing and invisible; it survives only
as a code comment. BUG-012 hit the same class of problem from the other side and
was solved by moving work _out_ of effects into render.

## What research would answer

1. Whether the drawer's modality — open state, focus trap, focus restoration,
   `inert` on the background — should be owned by one component or hook instead
   of split across two, and what that would cost.
2. Whether a single owner would have prevented any of the six prior tickets, or
   whether they were independent defects that merely share a surface.
3. Whether the project already has a pattern to reuse here — `useFocusTrap` is
   shared with `ConflictDialog`, so there may be a general modal-surface
   contract worth naming rather than a sidebar-specific fix.

## What it would contribute

Either a decision to consolidate ownership (with follow-up tickets), or a
recorded decision to accept the split with the effect-ordering contract written
down somewhere more durable than a comment. Both outcomes end the pattern of
discovering the ordering rule afresh each time this surface is touched.
