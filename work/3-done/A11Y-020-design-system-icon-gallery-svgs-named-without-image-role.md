---
id: A11Y-020
type: a11y
status: resolved
created: 2026-06-11
---

# A11Y-020: design-system icon gallery svgs named without image role

## Problem

`src/components/DesignSystem.tsx:94-103` — `IconSwatch` renders gallery icons as
`<Icon size={20} aria-hidden={false} aria-label={name} />`, but the icon
components in `src/components/Icons.tsx` are raw `<svg>` elements (base props
set `'aria-hidden': true` at `Icons.tsx:14`) with no role. An `<svg>` without
`role="img"` has an ambiguous default role, and several screen reader/browser
combos ignore `aria-label` on unrole'd svg, so the icons on the shipped
`/design-system` page (routed at `App.tsx:119`) are effectively unnamed images
despite `aria-hidden={false}` signaling they should be semantic. Violates WCAG
SC 1.1.1 Non-text Content and SC 4.1.2 Name, Role, Value (Level A). Severity:
LOW.

## Outcome

In the `/design-system` icon gallery, each icon graphic either exposes an image
role with a reliable accessible name matching the icon's name, or is
consistently decorative (hidden from assistive technology) with the visible
caption serving as the name — and no svg in the gallery carries an
accessible-name attribute that assistive technology can ignore.

## Why it matters

Screen reader users on the design-system page encounter graphics that announce
inconsistently across SR/browser combos — named in some, silent in others. It is
a Level A conformance gap on a shipped route, and the gallery is the one place
in the app where icons are meant to be semantic rather than decorative.

## Discovery notes

Advisory — `/work-start` may use or discard:

- `Icons.tsx`'s decorative-by-default design (`'aria-hidden': true` in base
  props) is correct for the rest of the app, where icons sit inside buttons that
  carry text or an `aria-label`. The gallery flipped `aria-hidden` without
  supplying the role that makes the name stick.
- Adjacent: `aria-hidden={false}` renders the literal attribute
  `aria-hidden="false"`, which is discouraged; it becomes unnecessary once a
  proper role/name (or full decorativeness) is chosen.

## Recommendation

Pick one of two fixes and apply it consistently in `IconSwatch`:

- (a) Make the icon semantic — pass `role="img"` alongside `aria-label={name}`
  (Icons accept an `SVGProps` spread, so `<Icon role="img" aria-label={name} />`
  overrides the base `aria-hidden`; remove the `aria-hidden={false}` literal).
- (b) Keep icons decorative — drop `aria-hidden={false}` and `aria-label`
  entirely and let the visible `<Caption>{name}</Caption>` name the swatch.

Pass criteria: the rendered gallery contains no `<svg>` with an `aria-label` but
no `role="img"`; no `aria-hidden="false"` appears in the DOM; and either every
gallery icon exposes role `img` with an accessible name equal to its icon name,
or every gallery icon is aria-hidden with its caption text present.

## Related work

- None directly. A11Y-001…A11Y-010 (`work/3-done/`) touch other surfaces;
  A11Y-011…A11Y-019 (`work/1-inbox/`) are sibling tickets from the same audit.

## Working

- Chose option (a) (semantic icons): the gallery's purpose is showing the icons
  themselves, so naming them as images is more useful to SR users than option
  (b)'s caption-only treatment.
- `aria-hidden={undefined}` (not `false`) suppresses the base decorative default
  entirely, so no aria-hidden attribute renders on gallery icons.
- Pass criteria covered 1:1 by the new DesignSystem test: no labeled svg without
  role="img", no aria-hidden="false" anywhere on the page, named image-role
  icons present.
