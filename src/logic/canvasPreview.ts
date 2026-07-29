import type { Quadrant } from '../types'

/**
 * One item's box in a square preview of the canvas, as fractions of that
 * square with a top-left origin. The caller multiplies by whatever size it
 * paints at, so the geometry is resolution-free.
 */
export interface PreviewPill {
  x: number
  y: number
  width: number
  height: number
}

// Pill size as a fraction of one quadrant. Wider than tall, echoing a real
// card's silhouette, and small enough that a crowded quadrant still reads as
// scattered cards rather than one white block.
const PILL_WIDTH = 0.26
const PILL_HEIGHT = 0.13

/**
 * Where every item lands in a square preview of the whole canvas. An item's
 * x/y are percentages of its own quadrant (see Card), so which quadrant holds
 * it is half of each coordinate.
 */
export function previewPills(quadrants: Quadrant[]): PreviewPill[] {
  return quadrants.flatMap((quadrant, index) => {
    const column = index % 2
    const row = Math.floor(index / 2)
    return quadrant.items.map((item) => ({
      x: (column + fitInsideQuadrant(item.x / 100, PILL_WIDTH)) / 2,
      y: (row + fitInsideQuadrant(item.y / 100, PILL_HEIGHT)) / 2,
      width: PILL_WIDTH / 2,
      height: PILL_HEIGHT / 2,
    }))
  })
}

/**
 * A card is positioned by its top-left corner and may sit at the far edge of
 * its quadrant (POSITION_MAX is 95). The pill has width, so painting it raw
 * would spill it across the quadrant line and misreport which quadrant the
 * item is in.
 */
function fitInsideQuadrant(fraction: number, size: number): number {
  return Math.max(0, Math.min(fraction, 1 - size))
}
