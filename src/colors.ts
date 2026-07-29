import type { DerivedColors, Quadrant } from './types'

export const defaultColors: string[] = ['#fbbf24', '#60a5fa', '#34d399', '#f472b6']

export const colorPresets: { hex: string; name: string }[] = [
  { hex: '#facc15', name: 'Yellow' },
  { hex: '#fbbf24', name: 'Amber' },
  { hex: '#f97316', name: 'Orange' },
  { hex: '#ef4444', name: 'Red' },
  { hex: '#f472b6', name: 'Pink' },
  { hex: '#a78bfa', name: 'Violet' },
  { hex: '#818cf8', name: 'Indigo' },
  { hex: '#60a5fa', name: 'Blue' },
  { hex: '#2dd4bf', name: 'Teal' },
  { hex: '#34d399', name: 'Emerald' },
  { hex: '#4ade80', name: 'Green' },
  { hex: '#a3e635', name: 'Lime' },
  { hex: '#94a3b8', name: 'Slate' },
  { hex: '#a8a29e', name: 'Stone' },
]

/**
 * Where any unparseable color lands. Hand-edited imports and hand-typed hex
 * both reach the render path, and painting NaN black is worse than slate.
 */
export const FALLBACK_COLOR = '#94a3b8'

export function isValidHexColor(value: unknown): value is string {
  return typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)
}

/**
 * Channel values for a hex color. Accepts 3- or 6-digit hex with or without
 * the leading hash — a wider net than isValidHexColor, because this feeds
 * pixel painting rather than the stored-color contract — and falls back to
 * FALLBACK_COLOR rather than returning NaN.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.startsWith('#') ? hex.slice(1) : hex
  if (/^[0-9a-fA-F]{3}$/.test(h)) {
    return [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
  }
  if (/^[0-9a-fA-F]{6}$/.test(h)) {
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
  }
  return hexToRgb(FALLBACK_COLOR)
}

/** sRGB channel (0–255) to linear light (0–1), for blending without banding. */
export function srgbToLinear(channel: number): number {
  const v = channel / 255
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
}

export function linearToSrgb(value: number): number {
  return 255 * (value <= 0.0031308 ? 12.92 * value : 1.055 * Math.pow(value, 1 / 2.4) - 0.055)
}

export function deriveColors(hex: string): DerivedColors {
  if (!isValidHexColor(hex)) {
    hex = FALLBACK_COLOR
  }
  const [r, g, b] = hexToRgb(hex)
  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.08)`,
    innerEdge: `rgba(${r}, ${g}, ${b}, 0.15)`,
    border: `rgba(${r}, ${g}, ${b}, 0.4)`,
    accent: hex,
  }
}

/**
 * The color a quadrant renders with: its own, or the default for the position
 * it occupies. One home for the fallback, so every surface resolves it alike.
 */
export function quadrantColor(quadrant: Quadrant | undefined, index: number): string {
  return quadrant?.color || defaultColors[index]
}

/**
 * The four quadrant colors in position order — top-left, top-right,
 * bottom-left, bottom-right — as CornerGradient consumes them. Always four,
 * whatever the framework holds.
 */
export function quadrantColors(quadrants: (Quadrant | undefined)[]): [string, string, string, string] {
  return [
    quadrantColor(quadrants[0], 0),
    quadrantColor(quadrants[1], 1),
    quadrantColor(quadrants[2], 2),
    quadrantColor(quadrants[3], 3),
  ]
}
