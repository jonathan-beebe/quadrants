import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'

/**
 * An installed PWA in `standalone` display owns the whole screen, rounded
 * corners and home-indicator strip included, so anything drawn at the raw edge
 * of the viewport is clipped or occluded by hardware (IMPRV-013).
 *
 * Two halves that only work together: `env(safe-area-inset-*)` resolves to 0
 * unless the viewport meta opts in with `viewport-fit=cover`, and the meta alone
 * pushes content further into the unsafe region. Both are asserted here.
 *
 * The shell states the inset once for everything in flow, extending BUG-017's
 * single-owner rule from height to insets. `position: fixed` is the exception
 * the physics forces: a fixed box positions against the viewport, not against
 * the shell's padding box, so every edge-pinned fixed surface has to restate the
 * inset itself. That exception is enumerated below rather than left to memory.
 *
 * Source-inspected rather than rendered because jsdom computes no layout and
 * loads no Tailwind — the same shape as viewportLock.test.ts and touchZoom.test.ts.
 */

const html = readFileSync('index.html', 'utf8')

/** The `content` of `<meta name="viewport">`. */
function viewportContent(source: string): string {
  const meta = /<meta\s+name="viewport"\s+content="([^"]*)"/.exec(source)
  if (!meta) throw new Error('index.html declares no viewport meta')
  return meta[1]
}

/** Source with `//` and block comments removed, so prose is not a hit. */
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

/** Every string literal in `source` — the class strings among them included. */
function stringLiterals(source: string): string[] {
  return [...code(source).matchAll(/`([^`]*)`|"([^"]*)"|'([^']*)'/g)].map((m) => m[1] ?? m[2] ?? m[3] ?? '')
}

/** A Tailwind offset that pins a box to an edge — `top-0`, `bottom-5`, `inset-x-3`. */
const EDGE_OFFSET = /\b(?:top|bottom|left|right|inset(?:-[xy])?)-(?!auto\b)[\w[\]./%-]+/

/**
 * Full-bleed backdrops. A scrim's whole job is to cover the display edge to
 * edge — insetting one would leave a live strip of app showing through it.
 * Position, not file: these are the class strings that paint nothing but a
 * translucent cover behind a modal surface.
 */
const BACKDROP = /\bbg-black\/\d+\b/

/**
 * `DesignSystem` is exempt for the same reason viewportLock.test.ts exempts it:
 * App renders it on an early return, outside the shell, as a gallery page.
 */
const EXEMPT_FILES = new Set(['src/components/DesignSystem.tsx'])

/** `file: literal` for every edge-pinned fixed surface in `file` lacking an inset. */
function unsafeFixedSurfaces(file: string): string[] {
  return stringLiterals(readFileSync(file, 'utf8'))
    .filter((literal) => /\bfixed\b/.test(literal))
    .filter((literal) => EDGE_OFFSET.test(literal))
    .filter((literal) => !BACKDROP.test(literal))
    .filter((literal) => !literal.includes('safe-area-inset'))
    .map((literal) => `${file}: ${literal.replace(/\s+/g, ' ').trim()}`)
}

describe('safe-area insets — IMPRV-013', () => {
  it('opts the layout viewport into the full display', () => {
    // Without this every env(safe-area-inset-*) below resolves to 0 and the
    // padding is a no-op.
    expect(viewportContent(html)).toContain('viewport-fit=cover')
  })

  it('does not scale-lock the viewport while opting in (BUG-016)', () => {
    // iOS auto-zooms sub-16px inputs and the temptation is to forbid zoom
    // outright. BUG-016 ruled that out on WCAG 1.4.4 grounds and fixed it with
    // a font-size floor instead (touchZoom.test.ts). Editing this line for
    // viewport-fit must not quietly reintroduce the scale lock.
    const content = viewportContent(html)
    expect(content).not.toContain('user-scalable')
    expect(content).not.toContain('maximum-scale')
  })

  it('states the inset once on the app shell', () => {
    // Everything in flow — the canvas, the corner labels, the zoomed footer —
    // inherits its safe area from here rather than rediscovering it.
    const shell = readFileSync('src/App.tsx', 'utf8')
    for (const edge of ['top', 'right', 'bottom', 'left']) {
      expect(shell, `the shell does not pad the ${edge} inset`).toContain(`env(safe-area-inset-${edge})`)
    }
  })

  it('has no edge-pinned fixed surface drawing outside the safe area', () => {
    // Shell padding cannot reach these: a fixed box is positioned against the
    // viewport, so it escapes the padding box of every ancestor.
    const offenders = componentFiles('src/components')
      .filter((file) => !EXEMPT_FILES.has(file))
      .concat('src/App.tsx')
      .flatMap(unsafeFixedSurfaces)

    expect(offenders).toEqual([])
  })
})
