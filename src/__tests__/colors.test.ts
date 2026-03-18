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

  it('contains valid hex color strings', () => {
    for (const color of colorPresets) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i)
    }
  })

  it('includes all default colors', () => {
    for (const color of defaultColors) {
      expect(colorPresets).toContain(color)
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
})
