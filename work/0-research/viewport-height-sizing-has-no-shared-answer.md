---
type: research
status: candidate
created: 2026-07-26
origin: BUG-015
---

# Candidate: the app has no shared answer for "how tall is the usable viewport"

Filed automatically while working BUG-015, per `work-start/types/bug.md`. Not an
allocated ticket — no id drawn, no journal entry. For the human to promote to
`1-inbox` (via `/work-scope`) or discard.

## Why this was filed

Three pieces of work now circle the same question from different sides:

- **BUG-003** (done) — the desktop template picker stopped short of the viewport
  bottom; fixed by pinning that screen to `h-screen`.
- **BUG-015** (this one) — the mobile canvas ran _past_ the visible viewport
  bottom because `h-screen` is `100vh`; fixed by moving that one screen to
  `h-svh`.
- **RSRCH-002** (open) — what the on-screen keyboard does to the same viewport,
  still unanswered.

Each was scoped and fixed as a local symptom. The recurrence is the signal.

## The smell

`h-screen` appears six times with no stated rule for which viewport any of them
means, and after BUG-015 the codebase is deliberately inconsistent:

- `QuadrantCanvas.tsx:166` — now `h-svh` (visible viewport).
- `App.tsx:177` — `h-screen`, the app shell wrapping everything.
- `Sidebar.tsx:99` — `h-screen`, the mobile drawer.
- `FrameworkBuilder.tsx:267` — `h-screen`, gated to desktop by BUG-003.
- `ErrorBoundary.tsx:32`, `DesignSystem.tsx:257` — `h-screen` / `min-h-screen`.

BUG-015's scope was fenced to the canvas chain by explicit decision, so the
others were left alone. That fence was right for the bug and leaves a real
inconsistency behind.

## What is actually still broken

`Sidebar.tsx:99` is the mobile drawer and is still `h-screen`, so its bottom
edge extends behind mobile Safari's toolbar exactly as the canvas did. Whatever
sits at the bottom of the drawer is subject to the same occlusion BUG-015 just
fixed for the canvas. This was not verified on device — it is inferred from the
same cause.

`App.tsx:177` is the shell. It is `overflow-hidden` and the canvas now sets the
visible bottom edge, so the consequence there is cosmetic at most (a strip of
page background behind the floating toolbar), not functional.

## What research would settle

Whether the app should have one viewport-height convention — when a surface
means the large viewport, when it means the visible one, and where that decision
is expressed so it is not re-litigated per screen. Note this interacts with
RSRCH-002: the keyboard is a third viewport state, and answering it per screen
will multiply the same inconsistency. Sequencing the two may matter more than
either alone.

Also worth settling: whether `viewport-fit=cover` is ever wanted. BUG-015 found
the default `auto` already keeps content clear of the home indicator, so `cover`
would create work rather than solve it — but that reasoning currently lives only
in a resolved ticket's working notes.
