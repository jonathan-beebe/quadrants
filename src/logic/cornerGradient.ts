import { hexToRgb, srgbToLinear, linearToSrgb } from '../colors'

/**
 * RGBA pixels for a `size`×`size` square blending four corner colors — given
 * top-left, top-right, bottom-left, bottom-right — through linear light, which
 * keeps the midtones from banding. Shared by every surface that paints the
 * blend, so the identity cannot drift between the canvas and its previews.
 */
export function cornerGradientPixels(colors: [string, string, string, string], size: number): Uint8ClampedArray {
  const lTL = hexToRgb(colors[0]).map(srgbToLinear)
  const lTR = hexToRgb(colors[1]).map(srgbToLinear)
  const lBL = hexToRgb(colors[2]).map(srgbToLinear)
  const lBR = hexToRgb(colors[3]).map(srgbToLinear)

  const pixels = new Uint8ClampedArray(size * size * 4)

  // Smoothstep biases blending toward the center, so each corner holds
  // its pure color further out before transitioning.
  const ease = (t: number) => t * t * (3 - 2 * t)

  for (let y = 0; y < size; y++) {
    const ev = ease(y / (size - 1))
    for (let x = 0; x < size; x++) {
      const eu = ease(x / (size - 1))
      const i = (y * size + x) * 4
      for (let c = 0; c < 3; c++) {
        const top = (1 - eu) * lTL[c] + eu * lTR[c]
        const bot = (1 - eu) * lBL[c] + eu * lBR[c]
        pixels[i + c] = linearToSrgb((1 - ev) * top + ev * bot)
      }
      pixels[i + 3] = 255
    }
  }

  return pixels
}
