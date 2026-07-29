import { describe, it, expect } from 'vitest'
import { cornerGradientPixels } from '../../logic/cornerGradient'
import { hexToRgb, srgbToLinear, linearToSrgb } from '../../colors'

const RED = '#ff0000'
const GREEN = '#00ff00'
const BLUE = '#0000ff'
const WHITE = '#ffffff'

function pixelAt(pixels: Uint8ClampedArray, size: number, x: number, y: number): [number, number, number, number] {
  const i = (y * size + x) * 4
  return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]]
}

describe('cornerGradientPixels', () => {
  it('fills RGBA for every pixel of the square', () => {
    expect(cornerGradientPixels([RED, GREEN, BLUE, WHITE], 8)).toHaveLength(8 * 8 * 4)
  })

  it('paints every pixel fully opaque', () => {
    const pixels = cornerGradientPixels([RED, GREEN, BLUE, WHITE], 4)
    for (let i = 3; i < pixels.length; i += 4) {
      expect(pixels[i]).toBe(255)
    }
  })

  it('holds each corner at its own color', () => {
    const size = 3
    const pixels = cornerGradientPixels([RED, GREEN, BLUE, WHITE], size)
    expect(pixelAt(pixels, size, 0, 0)).toEqual([255, 0, 0, 255])
    expect(pixelAt(pixels, size, 2, 0)).toEqual([0, 255, 0, 255])
    expect(pixelAt(pixels, size, 0, 2)).toEqual([0, 0, 255, 255])
    expect(pixelAt(pixels, size, 2, 2)).toEqual([255, 255, 255, 255])
  })

  it('blends the center in linear light, not in sRGB', () => {
    // The visible difference: a linear-light average of the four corners is
    // lighter than averaging the sRGB bytes. Guards against the blend quietly
    // regressing to naive channel arithmetic.
    const size = 3
    const pixels = cornerGradientPixels([RED, GREEN, BLUE, WHITE], size)
    const corners = [RED, GREEN, BLUE, WHITE].map((hex) => hexToRgb(hex))

    const center = pixelAt(pixels, size, 1, 1)
    for (let channel = 0; channel < 3; channel++) {
      const linearMean = corners.reduce((sum, rgb) => sum + srgbToLinear(rgb[channel]), 0) / 4
      expect(center[channel]).toBe(Math.round(linearToSrgb(linearMean)))
    }
  })

  it('eases toward the corners, so a corner holds its color past the first pixel', () => {
    // Smoothstep, not linear: one step in from a corner stays nearer that
    // corner than a straight ramp would put it.
    const size = 21
    const pixels = cornerGradientPixels([RED, WHITE, RED, WHITE], size)
    const [, greenChannel] = pixelAt(pixels, size, 2, 0)
    const linearRamp = linearToSrgb((2 / (size - 1)) * srgbToLinear(255))
    expect(greenChannel).toBeLessThan(linearRamp)
  })
})
