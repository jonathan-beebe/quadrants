import { describe, it, expect } from 'vitest'
import {
  defaultColors,
  colorPresets,
  deriveColors,
  isValidHexColor,
  quadrantColor,
  quadrantColors,
  hexToRgb,
  srgbToLinear,
  linearToSrgb,
  FALLBACK_COLOR,
} from '../colors'
import type { Quadrant } from '../types'

describe('defaultColors', () => {
  it('provides exactly 4 default colors', () => {
    expect(defaultColors).toHaveLength(4)
  })

  it('contains valid hex color strings', () => {
    for (const color of defaultColors) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })
})

describe('colorPresets', () => {
  it('provides 14 preset colors', () => {
    expect(colorPresets).toHaveLength(14)
  })

  it('contains valid hex color strings with names', () => {
    for (const preset of colorPresets) {
      expect(preset.hex).toMatch(/^#[0-9a-f]{6}$/i)
      expect(preset.name).toBeTruthy()
    }
  })

  it('includes all default colors', () => {
    const hexValues = colorPresets.map((p) => p.hex)
    for (const color of defaultColors) {
      expect(hexValues).toContain(color)
    }
  })
})

describe('deriveColors', () => {
  it('returns every derived variant from a hex color', () => {
    const result = deriveColors('#ff0000')
    expect(result).toEqual({
      bg: 'rgba(255, 0, 0, 0.08)',
      innerEdge: 'rgba(255, 0, 0, 0.15)',
      border: 'rgba(255, 0, 0, 0.4)',
      accent: '#ff0000',
    })
  })

  it('derives innerEdge from the same validated hex as the other variants (RFCTR-017)', () => {
    // 'red' is not a valid #rrggbb, so every variant must come from the
    // slate fallback rather than a NaN parse of the caller's string.
    const result = deriveColors('red')
    expect(result.innerEdge).toBe('rgba(148, 163, 184, 0.15)')
  })

  it('handles mixed-case hex values', () => {
    const result = deriveColors('#FfAa00')
    expect(result.bg).toBe('rgba(255, 170, 0, 0.08)')
  })

  it('returns the original hex as accent', () => {
    const hex = '#34d399'
    expect(deriveColors(hex).accent).toBe(hex)
  })

  it('falls back to a safe color when given a non-hex string (BUG-017)', () => {
    expect(() => deriveColors('red')).not.toThrow()
    const result = deriveColors('red')
    expect(result.bg).not.toMatch(/NaN/)
    expect(result.border).not.toMatch(/NaN/)
    expect(result.accent).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('falls back to a safe color when given a non-string value (BUG-017)', () => {
    expect(() => deriveColors(42 as unknown as string)).not.toThrow()
    const result = deriveColors(99 as unknown as string)
    expect(result.bg).not.toMatch(/NaN/)
    expect(result.border).not.toMatch(/NaN/)
    expect(result.accent).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('is pure: repeated calls return value-equal results across many hex inputs (BUG-024)', () => {
    // Regression guard against re-introducing a module-level cache. If the
    // function stays pure, two independent invocations for any hex should
    // produce structurally equal results without leaking shared state. We
    // exercise a large set of distinct hex values to make sure no path
    // accumulates incorrect state across calls.
    for (let i = 0; i < 1000; i++) {
      const hex = `#${i.toString(16).padStart(6, '0')}`
      const a = deriveColors(hex)
      const b = deriveColors(hex)
      expect(a).toEqual(b)
      expect(a.accent).toBe(hex)
    }
  })

  it('does not export a module-level color cache (BUG-024)', async () => {
    const mod = await import('../colors')
    expect((mod as Record<string, unknown>).colorCache).toBeUndefined()
  })
})

describe('isValidHexColor', () => {
  it('accepts 6-digit hex colors and rejects everything else (BUG-006)', () => {
    expect(isValidHexColor('#fbbf24')).toBe(true)
    expect(isValidHexColor('#FBBF24')).toBe(true)
    expect(isValidHexColor('#abc')).toBe(false)
    expect(isValidHexColor('red')).toBe(false)
    expect(isValidHexColor('rgb(255,0,0)')).toBe(false)
    expect(isValidHexColor('')).toBe(false)
    expect(isValidHexColor(42)).toBe(false)
    expect(isValidHexColor(undefined)).toBe(false)
  })
})

describe('quadrantColor', () => {
  const quadrant = (color: string): Quadrant => ({ label: 'Q', color, items: [] })

  it('uses the quadrant’s own color when it has one', () => {
    expect(quadrantColor(quadrant('#ff0000'), 2)).toBe('#ff0000')
  })

  it('falls back to the default for the quadrant’s position', () => {
    expect(quadrantColor(quadrant(''), 2)).toBe(defaultColors[2])
    expect(quadrantColor(undefined, 3)).toBe(defaultColors[3])
  })
})

describe('quadrantColors', () => {
  it('resolves all four positions, in order', () => {
    const quadrants: Quadrant[] = ['#111111', '', '#333333', ''].map((color) => ({ label: 'Q', color, items: [] }))
    expect(quadrantColors(quadrants)).toEqual(['#111111', defaultColors[1], '#333333', defaultColors[3]])
  })

  it('always yields four colors, even when quadrants are missing', () => {
    expect(quadrantColors([])).toEqual(defaultColors)
  })
})

describe('hexToRgb', () => {
  it('parses 6-digit hex, with or without the leading hash', () => {
    expect(hexToRgb('#ff8000')).toEqual([255, 128, 0])
    expect(hexToRgb('ff8000')).toEqual([255, 128, 0])
  })

  it('parses 3-digit shorthand by doubling each digit', () => {
    expect(hexToRgb('#f80')).toEqual([255, 136, 0])
  })

  it('falls back to the shared fallback color rather than parsing NaN', () => {
    expect(hexToRgb('red')).toEqual(hexToRgb(FALLBACK_COLOR))
    expect(hexToRgb('')).toEqual(hexToRgb(FALLBACK_COLOR))
  })
})

describe('srgbToLinear / linearToSrgb', () => {
  it('round-trips a channel back to where it started', () => {
    for (const channel of [0, 12, 128, 200, 255]) {
      expect(linearToSrgb(srgbToLinear(channel))).toBeCloseTo(channel, 6)
    }
  })

  it('maps the endpoints exactly', () => {
    expect(srgbToLinear(0)).toBe(0)
    expect(srgbToLinear(255)).toBeCloseTo(1, 6)
  })
})
