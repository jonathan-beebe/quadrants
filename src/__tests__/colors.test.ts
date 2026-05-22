import { describe, it, expect } from 'vitest'
import { defaultColors, colorPresets, deriveColors } from '../colors'

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
  it('provides 10 preset colors', () => {
    expect(colorPresets).toHaveLength(10)
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
  it('returns bg, border, and accent from a hex color', () => {
    const result = deriveColors('#ff0000')
    expect(result).toEqual({
      bg: 'rgba(255, 0, 0, 0.08)',
      border: 'rgba(255, 0, 0, 0.4)',
      accent: '#ff0000',
    })
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
