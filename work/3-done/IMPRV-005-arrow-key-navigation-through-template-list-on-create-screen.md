---
id: IMPRV-005
type: improvement
status: resolved
created: 2026-07-26
resolved: 2026-07-26
---

# IMPRV-005: arrow-key navigation through template list on create screen

## Problem

On the Create Framework screen, the template list in
`src/components/FrameworkBuilder.tsx:117-166` (the "Blank / Custom" entry plus
category-grouped template buttons, rendered as the desktop master list at
`:288-292` and inside the mobile picker dialog at `:273-283`) supports only
pointer clicks and Tab traversal. Pressing ArrowUp/ArrowDown while focus is in
the list does nothing except native scroll — a keyboard user must Tab through
every one of the 30+ template buttons to reach a later category, and there is no
fast way to move through the frameworks.

## Goal

Keyboard users can move through the template list quickly with the up/down arrow
keys, matching the standard list-navigation idiom.

## Outcome

With focus in the template list on the Create Framework screen (both the desktop
list and the mobile picker), pressing ArrowDown moves to the next entry and
ArrowUp to the previous entry, traversing the full filtered list in visual order
— "Blank / Custom" first, then across category-group boundaries — without
getting stuck at a group edge; the current entry stays scrolled into view; and
the behavior is covered by tests.

## Why it matters

The template picker is the on-ramp to the product's core value (per IMPRV-002),
and the app holds itself to a high accessibility bar. Tab-only traversal of a
30+ item list is slow and fatiguing for keyboard users, and arrow-key movement
is the idiom keyboard and assistive-technology users expect in a selection list.

## Discovery notes

Entries are plain `<button>`s with `aria-current` marking the selection, laid
out in DOM order matching visual order, so a roving-focus sweep over the list
container is a natural starting point. The house pattern for arrow navigation
already exists in `src/hooks/useMenuKeyboardNav.ts` (used by Sidebar menus;
walks `[role="menuitem"]`/`[role="option"]` elements) and may generalize. Design
points the maker should settle: whether selection follows focus (arrowing
applies the template and updates the detail preview immediately, listbox-style)
or arrows move focus only with Enter/Space applying; whether ArrowDown from the
"Filter templates" input should drop into the list (combobox idiom); and
wrap-around vs. stop-at-ends. Whatever semantics are chosen should be reflected
in ARIA roles (a roving-tabindex listbox may fit better than bare buttons) while
keeping A11Y-016's dialog semantics on the mobile picker intact.

## Related work

- IMPRV-002 — redesign template picker as responsive master-detail
- FEAT-002 — quadrant model template library with descriptions
- A11Y-016 — mobile template picker trigger announces listbox not dialog
- BUG-003 — desktop picker list extends to bottom of viewport

## Working

The four design points the ticket left open, and how they were settled:

- **Selection does not follow focus.** `applyTemplate`
  (`FrameworkBuilder.tsx:55-62`) overwrites the name, both axis labels, all four
  quadrant labels and the colors. Arrowing with selection-follows-focus would
  wipe whatever the user had typed on every keypress, so arrows move focus only
  and Enter/Space (native button activation) applies. Pinned by the "leaves the
  form untouched until the focused entry is activated" test.
- **ArrowDown from the filter input enters the list**, ArrowUp enters at the
  bottom. This is the payoff case — filter, then arrow into the results.
- **Wrap-around at both ends**, matching the house behavior in
  `useMenuKeyboardNav`.
- **Entries stay buttons; no listbox conversion.** A `role="listbox"` /
  `role="option"` rewrite would mean a roving tabindex, `aria-selected`
  replacing `aria-current`, group semantics per category, and the full APG
  contract (Home/End, typeahead) to be honest about the role — a much larger
  change than the goal needs, and it would disturb A11Y-016's dialog semantics.
  Arrow keys as an accelerator over ordinary buttons breaks no ARIA contract;
  Tab still reaches every entry as before.

Not added: `aria-keyshortcuts` on entries (the A11Y-010 precedent). On one
focused card it informs; repeated across 31 entries it is noise on every
announcement.

"Stays scrolled into view" needs no code — browsers scroll a newly focused
element into view natively. jsdom does not implement scrolling, so there is no
test for it.

Placement: the arrow math lives in the hook (`hooks/useListArrowNav.ts`) rather
than `logic/`, matching its sibling `useMenuKeyboardNav` — `logic/` is reserved
for pure _domain_ logic, and focus traversal is DOM mechanics.
