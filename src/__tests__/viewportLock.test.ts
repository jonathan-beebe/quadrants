import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'

/**
 * On iOS `vh` resolves to the *large* viewport — the height the page would have
 * with the browser chrome retracted — while the scrollport is the small one.
 * Any surface sized in `vh` is therefore taller than the space it is given, and
 * the overflow becomes scroll: the document's own if nothing clips it, or an
 * ancestor's if something does. Either way the canvas stops being fixed and its
 * bottom edge walks back under Safari's toolbar (BUG-015, BUG-017).
 *
 * The fix is an invariant rather than a value: nothing rendered inside the app
 * shell states its own opinion about the viewport in `vh`. `svh` (static, the
 * viewport with chrome shown) is the unit that means what these layouts mean.
 * `dvh` is deliberately not blessed — it changes as chrome retracts, which
 * would resize the canvas mid-interaction and reintroduce the card-position
 * shift 4996ae3 removed.
 *
 * Guarded here rather than in a rendering test because jsdom computes no layout
 * and loads no Tailwind, so there is no height to assert. Follows the same
 * source-inspection shape as touchZoom.test.ts (BUG-016).
 */

/** Tailwind utilities that expand to a large-viewport (`vh`) height. */
const SCREEN_UTILITY = /\b(?:min-|max-)?h-screen\b/g

/** A raw `vh` length — `[60vh]`, `100vh`. `svh` / `dvh` / `lvh` are not it. */
const RAW_VH = /(?<![sdl])\b\d+(?:\.\d+)?vh\b/g

/**
 * `DesignSystem` is exempt: App renders it on its own early return, *before*
 * the shell (`App.tsx`, the `activeId === 'design-system'` branch), so it is
 * not inside the shell at all. It is a long gallery page whose document scroll
 * is the correct behavior. If it is ever moved inside the shell, drop it from
 * this list — the exemption is about position, not about the file.
 */
const EXEMPT = new Set(['src/components/DesignSystem.tsx'])

/** Source with `//` and block comments removed, so prose about `vh` is not a hit. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

/** Every `.tsx` file under `dir`, recursively. */
function componentFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) return componentFiles(path)
    return entry.name.endsWith('.tsx') ? [path] : []
  })
}

/** `file: match` for every large-viewport unit in `file`. */
function largeViewportUnits(file: string): string[] {
  const source = code(readFileSync(file, 'utf8'))
  return [...source.matchAll(SCREEN_UTILITY), ...source.matchAll(RAW_VH)].map((m) => `${file}: ${m[0]}`)
}

describe('viewport lock — BUG-017', () => {
  it('sizes the app shell against the visible viewport, not the large one', () => {
    // The shell wraps every screen, so a `vh` here makes the whole document
    // taller than its scrollport and every screen inherits the scroll.
    expect(largeViewportUnits('src/App.tsx')).toEqual([])
  })

  it('has no surface inside the shell claiming the large viewport', () => {
    // One `vh` below the shell is enough to reintroduce the overflow, this time
    // as an internal scrollbar in whichever ancestor clips it.
    const offenders = componentFiles('src/components')
      .filter((file) => !EXEMPT.has(file))
      .flatMap(largeViewportUnits)

    expect(offenders).toEqual([])
  })
})
