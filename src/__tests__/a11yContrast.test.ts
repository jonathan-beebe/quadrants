import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// vitest resolves test runs from the project root.
const css = readFileSync('src/index.css', 'utf8')

// WCAG relative luminance / contrast ratio (SC 1.4.3).
function luminance(hex: string): number {
  const channel = (c: number) => {
    const v = c / 255
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  }
  const r = channel(parseInt(hex.slice(1, 3), 16))
  const g = channel(parseInt(hex.slice(3, 5), 16))
  const b = channel(parseInt(hex.slice(5, 7), 16))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Extract theme tokens from index.css. The light theme lives in the @theme
 * block; the dark theme overrides inside `.dark body, .dark`.
 */
function tokens(theme: 'light' | 'dark'): Record<string, string> {
  const block =
    theme === 'light'
      ? /@theme\s*\{([^}]*)\}/.exec(css)?.[1]
      : /\.dark\s*\{([^}]*)\}/.exec(css.replace(/\.dark body,\s*/g, ''))?.[1]
  if (!block) throw new Error(`Could not find ${theme} theme tokens in index.css`)
  const out: Record<string, string> = {}
  for (const m of block.matchAll(/(--color-[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    out[m[1]] = m[2]
  }
  return out
}

describe.each(['light', 'dark'] as const)('%s theme token contrast', (theme) => {
  const t = tokens(theme)

  it('on-accent text on the accent surface meets AA (≥4.5:1) — A11Y-011', () => {
    expect(contrastRatio(t['--color-on-accent'], t['--color-accent'])).toBeGreaterThanOrEqual(4.5)
  })

  it('on-accent text on the hover accent surface meets AA (≥4.5:1) — A11Y-011', () => {
    expect(contrastRatio(t['--color-on-accent'], t['--color-accent-hover'])).toBeGreaterThanOrEqual(4.5)
  })

  it('on-danger text on the danger surface meets AA (≥4.5:1) — A11Y-012', () => {
    expect(contrastRatio(t['--color-on-danger'], t['--color-danger'])).toBeGreaterThanOrEqual(4.5)
  })

  it('on-danger text on the hover danger surface meets AA (≥4.5:1) — A11Y-012', () => {
    expect(contrastRatio(t['--color-on-danger'], t['--color-danger-hover'])).toBeGreaterThanOrEqual(4.5)
  })

  it('placeholder text (text-tertiary) meets AA on every input surface (≥4.5:1) — A11Y-018', () => {
    // Inputs render on bg-surface; the page background is the worst case
    // for any input that inherits it.
    expect(contrastRatio(t['--color-text-tertiary'], t['--color-surface'])).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(t['--color-text-tertiary'], t['--color-bg'])).toBeGreaterThanOrEqual(4.5)
  })
})
