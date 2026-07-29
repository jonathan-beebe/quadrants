import { describe, it, expect } from 'vitest'
import { previewPills } from '../../logic/canvasPreview'
import type { Item, Quadrant } from '../../types'

function item(overrides: Partial<Item> = {}): Item {
  return { id: 'i1', text: 'Item', x: 10, y: 10, createdAt: 1000, ...overrides }
}

function quadrants(items: Item[][]): Quadrant[] {
  return items.map((quadrantItems, i) => ({
    label: `Q${i + 1}`,
    color: '#fbbf24',
    items: quadrantItems,
  }))
}

const empty = quadrants([[], [], [], []])

describe('previewPills', () => {
  it('yields nothing for a framework with no items', () => {
    expect(previewPills(empty)).toEqual([])
  })

  it('yields one pill per item, across every quadrant', () => {
    const pills = previewPills(quadrants([[item(), item()], [item()], [], [item()]]))
    expect(pills).toHaveLength(4)
  })

  it('places each quadrant’s items in that quadrant’s own corner of the square', () => {
    const atOrigin = [item({ x: 0, y: 0 })]
    const [topLeft] = previewPills(quadrants([atOrigin, [], [], []]))
    const [topRight] = previewPills(quadrants([[], atOrigin, [], []]))
    const [bottomLeft] = previewPills(quadrants([[], [], atOrigin, []]))
    const [bottomRight] = previewPills(quadrants([[], [], [], atOrigin]))

    expect(topLeft).toMatchObject({ x: 0, y: 0 })
    expect(topRight).toMatchObject({ x: 0.5, y: 0 })
    expect(bottomLeft).toMatchObject({ x: 0, y: 0.5 })
    expect(bottomRight).toMatchObject({ x: 0.5, y: 0.5 })
  })

  it('scales a position within its quadrant, not across the whole square', () => {
    // 50% into the top-left quadrant is a quarter of the way across the square.
    const [pill] = previewPills(quadrants([[item({ x: 50, y: 50 })], [], [], []]))
    expect(pill.x).toBeCloseTo(0.25)
    expect(pill.y).toBeCloseTo(0.25)
  })

  it('keeps a pill at the far edge of its position range inside its own quadrant', () => {
    // POSITION_MAX is 95, and a pill has width — placed raw it would spill
    // into the neighbouring quadrant and misreport which quadrant holds it.
    const edge = [item({ x: 95, y: 95 })]
    const [topLeft] = previewPills(quadrants([edge, [], [], []]))
    expect(topLeft.x + topLeft.width).toBeLessThanOrEqual(0.5)
    expect(topLeft.y + topLeft.height).toBeLessThanOrEqual(0.5)

    const [bottomRight] = previewPills(quadrants([[], [], [], edge]))
    expect(bottomRight.x + bottomRight.width).toBeLessThanOrEqual(1)
    expect(bottomRight.y + bottomRight.height).toBeLessThanOrEqual(1)
  })

  it('sizes every pill alike, whatever the item says', () => {
    const pills = previewPills(
      quadrants([[item({ text: 'x' }), item({ text: 'a much longer item label' })], [], [], []]),
    )
    expect(pills[0].width).toBe(pills[1].width)
    expect(pills[0].height).toBe(pills[1].height)
    expect(pills[0].width).toBeGreaterThan(pills[0].height)
  })
})
