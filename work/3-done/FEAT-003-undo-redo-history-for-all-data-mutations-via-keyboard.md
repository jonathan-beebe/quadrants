---
id: FEAT-003
type: feature
status: resolved
created: 2026-06-12
---

# FEAT-003: undo-redo history for all data mutations via keyboard shortcuts

## Problem

The app has no undo/redo. Every mutation of the frameworks data model (item
add/edit/delete/move/reposition, quadrant color changes, framework
create/delete/duplicate/structure edits, share/file imports) is applied
immediately and irreversibly — pure functions in `src/logic/items.ts:14-78` and
`src/logic/framework.ts:73-140` are wired straight to setState in
`src/hooks/useFrameworks.ts` and `src/components/QuadrantCanvas.tsx`, then
auto-persisted to localStorage on every change
(`src/hooks/useFrameworks.ts:17-22`). A destructive mistake (deleting an item,
deleting a whole framework, a bad import overwrite) cannot be reversed. There is
also no global keyboard-shortcut infrastructure — all key handling today is
component-local (e.g. `Card.tsx:193-238`).

## Outcome

After any mutation of framework data, pressing Cmd/Ctrl+Z on a viewport wider
than the app's existing mobile breakpoint restores the exact prior state, and
Cmd/Ctrl+Y re-applies it; repeated presses walk the whole session's history in
order; performing a new action after an undo discards the redo branch; what is
persisted in localStorage always matches what is on screen, including after
undo/redo; when focus is inside an active text-editing field, the shortcuts do
not hijack native text-editing undo. Preferences (theme), navigation, and
ephemeral UI state (sidebar, open menus) are not undoable. No undo/redo buttons
are added and mobile behavior is unchanged.

## Why it matters

All user data lives in this one local data model with immediate, silent
persistence — a single slip (delete, drag, overwrite-on-import) destroys work
with no recovery path. Undo is also the safety net that makes the rest of the UI
feel safe to explore.

## Discovery notes

Advisory — /work-start may use or discard.

- The codebase is already functional-core / imperative-shell: every mutation is
  a pure `(state, args) → newState` function and all framework data lives in one
  useState in `useFrameworks.ts:14` — one history mechanism at that choke point
  can cover everything.
- The reporter's explicit direction was a command-pattern mechanic: funnel every
  mutating action through a single dispatch point that records history. The
  existing pure logic functions make command objects or whole-state snapshots
  equally cheap to capture; the maker chooses the shape. Mechanics first —
  shortcuts only, no buttons, no mobile support yet.
- Persistence is an effect keyed on that same state, so undo/redo states persist
  for free; the maker should decide whether intermediate history needs to stay
  out of storage.
- Arrow-key repositioning fires one mutation per keypress — the maker must
  decide whether bursts coalesce into one undo step or stay 1:1.
- "Large screens" should reuse `useIsMobile.ts:3` (`max-width: 768px`) rather
  than introduce a new breakpoint.
- macOS convention pairs Cmd+Shift+Z with redo alongside the requested
  Cmd/Ctrl+Y.

## Related work

- RSRCH-001 — deterministic core via injected time and id generation; undo/redo
  replay interacts with id and timestamp generation
- BUG-010 — localStorage save-failure toast; history must not break that error
  path
- A11Y-010 — keyboard repositioning in 5%/15% steps generates rapid
  micro-mutations
- MAINT-005 — drop side effect moved out of state updater; mutations are now
  clean single entry points

## Working

- Re-validated 2026-06-12: still applies — no history/undo code exists; all
  framework-data mutations flow through `useFrameworks` callbacks (8 entry
  points), each already a pure-function + setState pair.
- Shape chosen: pure `History<T>` module (`past`/`present`/`future` snapshots
  with structural sharing) in `src/logic/history.ts`; `useFrameworks` routes
  every mutation through one internal `apply(updater)` dispatch point that
  commits to history — the reporter's single-dispatch-point intent without
  command-object boilerplate.
- Open decisions resolved: reposition keystrokes stay 1:1 with undo steps;
  history capped at 100 entries; only `present` is persisted (intermediate
  history never hits localStorage). Cmd+Shift+Z accepted as redo alias.
- Undo that removes the active framework is covered by the existing
  redirect-home effect (App.tsx:75-81).
