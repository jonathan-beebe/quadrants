import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'

// vitest resolves test runs from the project root.
const css = readFileSync('src/index.css', 'utf8')

/**
 * iOS Safari zooms the layout viewport whenever a text-entry control with a
 * computed font-size under 16px takes focus, and never restores the scale on
 * blur. A scaled layout viewport is larger than the visual one, so the canvas
 * — sized to the full viewport — overflows and its edges are clipped (BUG-016).
 */
const FLOOR_PX = 16

const COARSE_POINTER = /@media\s*\(\s*pointer\s*:\s*coarse\s*\)/

/** Body of the brace-balanced block whose header begins at `from`. */
function blockAt(source: string, from: number): string {
  const open = source.indexOf('{', from)
  let depth = 0
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}' && --depth === 0) return source.slice(open + 1, i)
  }
  throw new Error('unbalanced braces in index.css')
}

/** The stylesheet with every `@layer name { … }` block removed. */
function unlayered(source: string): string {
  let out = source
  for (;;) {
    const at = /@layer\s+[\w-]+\s*\{/.exec(out)
    if (!at) return out
    const open = out.indexOf('{', at.index)
    out = out.slice(0, at.index) + out.slice(open + blockAt(out, at.index).length + 2)
  }
}

/** The `(pointer: coarse)` block's body, or null if the sheet has none. */
function coarseBlock(source: string): string | null {
  const at = COARSE_POINTER.exec(source)
  return at ? blockAt(source, at.index) : null
}

/** Every .tsx file under `dir`, recursively. */
function componentFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = `${dir}/${entry.name}`
    if (entry.isDirectory()) return componentFiles(path)
    return entry.name.endsWith('.tsx') ? [path] : []
  })
}

describe('touch-device font-size floor — BUG-016', () => {
  it(`floors text-entry controls at ${FLOOR_PX}px under a coarse pointer`, () => {
    const block = coarseBlock(css)
    expect(block, 'index.css declares no @media (pointer: coarse) block').not.toBeNull()

    const rule = /([^{}]+)\{([^{}]*font-size[^{}]*)\}/.exec(block!)
    expect(rule, 'the coarse-pointer block declares no font-size').not.toBeNull()

    const [, selector, declarations] = rule!
    for (const control of ['input', 'textarea', 'select']) {
      expect(selector, `the floor does not cover <${control}>`).toContain(control)
    }

    const sizes = [...declarations.matchAll(/(\d+(?:\.\d+)?)px/g)].map((m) => Number(m[1]))
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(FLOOR_PX)
  })

  it('declares the floor outside @layer, where Tailwind utilities cannot override it', () => {
    // Tailwind v4 orders utilities last, so a `text-sm` at a callsite beats
    // anything in @layer base no matter how specific. Only unlayered CSS
    // outranks the utility layer.
    expect(
      coarseBlock(unlayered(css)),
      'the coarse-pointer floor sits inside @layer, so `text-sm` on an input still wins',
    ).not.toBeNull()
  })

  it('has no component overriding the floor with an inline font-size', () => {
    // Inline styles beat even unlayered CSS, so they are the one way back to
    // a sub-16px control.
    const offenders = componentFiles('src/components').flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/fontSize:\s*['"`]?(\d+(?:\.\d+)?)px/g)]
        .filter((m) => Number(m[1]) < FLOOR_PX)
        .map((m) => `${file}: ${m[0]}`),
    )
    expect(offenders).toEqual([])
  })
})
