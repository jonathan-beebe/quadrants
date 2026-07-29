import { describe, it, expect } from 'vitest'
import {
  createItem,
  addItem,
  removeItem,
  updateItemText,
  moveItem,
  setQuadrantColor,
  clientToContainerPoint,
  clientToQuadrantPercent,
  getQuadrantAtPoint,
  moveTargetsFrom,
} from '../../logic/items'
import type { Framework, Item } from '../../types'

function makeFramework(): Framework {
  return {
    id: 'fw-1',
    name: 'Test',
    axisX: '',
    axisY: '',
    quadrants: [
      { label: 'A', color: '#fbbf24', items: [{ id: 'i1', text: 'Item 1', x: 10, y: 20, createdAt: 1000 }] },
      { label: 'B', color: '#60a5fa', items: [{ id: 'i2', text: 'Item 2', x: 30, y: 40, createdAt: 1000 }] },
      { label: 'C', color: '#34d399', items: [] },
      { label: 'D', color: '#f472b6', items: [] },
    ],
    createdAt: 1000,
    updatedAt: 1000,
  }
}

const newItem: Item = { id: 'i-new', text: 'New', x: 50, y: 50, createdAt: 2000 }

describe('addItem', () => {
  it('adds an item to the specified quadrant', () => {
    const result = addItem(makeFramework(), 2, newItem)
    expect(result.quadrants[2].items).toHaveLength(1)
    expect(result.quadrants[2].items[0].text).toBe('New')
  })

  it('does not modify other quadrants', () => {
    const fw = makeFramework()
    const result = addItem(fw, 2, newItem)
    expect(result.quadrants[0].items).toHaveLength(1)
    expect(result.quadrants[1].items).toHaveLength(1)
  })
})

describe('removeItem', () => {
  it('removes the item from the specified quadrant', () => {
    const result = removeItem(makeFramework(), 0, 'i1')
    expect(result.quadrants[0].items).toHaveLength(0)
  })

  it('does not modify other quadrants', () => {
    const result = removeItem(makeFramework(), 0, 'i1')
    expect(result.quadrants[1].items).toHaveLength(1)
  })

  it('returns unchanged framework if item not found', () => {
    const fw = makeFramework()
    const result = removeItem(fw, 0, 'nonexistent')
    expect(result.quadrants[0].items).toHaveLength(1)
  })
})

describe('updateItemText', () => {
  it('updates the text of the specified item', () => {
    const result = updateItemText(makeFramework(), 0, 'i1', 'Updated text')
    expect(result.quadrants[0].items[0].text).toBe('Updated text')
  })

  it('preserves other item properties', () => {
    const result = updateItemText(makeFramework(), 0, 'i1', 'Updated')
    expect(result.quadrants[0].items[0].x).toBe(10)
    expect(result.quadrants[0].items[0].y).toBe(20)
    expect(result.quadrants[0].items[0].id).toBe('i1')
  })
})

describe('moveItem', () => {
  it('moves an item within the same quadrant (repositions)', () => {
    const result = moveItem(makeFramework(), 0, 0, 'i1', 55, 65)
    expect(result.quadrants[0].items).toHaveLength(1)
    expect(result.quadrants[0].items[0].x).toBe(55)
    expect(result.quadrants[0].items[0].y).toBe(65)
  })

  it('moves an item between quadrants', () => {
    const result = moveItem(makeFramework(), 0, 2, 'i1', 30, 40)
    expect(result.quadrants[0].items).toHaveLength(0)
    expect(result.quadrants[2].items).toHaveLength(1)
    expect(result.quadrants[2].items[0].text).toBe('Item 1')
    expect(result.quadrants[2].items[0].x).toBe(30)
    expect(result.quadrants[2].items[0].y).toBe(40)
  })

  it('returns unchanged framework if source item not found', () => {
    const fw = makeFramework()
    const result = moveItem(fw, 0, 2, 'nonexistent', 0, 0)
    expect(result).toBe(fw)
  })

  it('does not modify other quadrants during cross-quadrant move', () => {
    const result = moveItem(makeFramework(), 0, 2, 'i1', 30, 40)
    expect(result.quadrants[1].items).toHaveLength(1)
    expect(result.quadrants[3].items).toHaveLength(0)
  })
})

describe('setQuadrantColor', () => {
  it('changes the color of the specified quadrant', () => {
    const result = setQuadrantColor(makeFramework(), 1, '#ff0000')
    expect(result.quadrants[1].color).toBe('#ff0000')
  })

  it('does not modify other quadrants', () => {
    const result = setQuadrantColor(makeFramework(), 1, '#ff0000')
    expect(result.quadrants[0].color).toBe('#fbbf24')
  })
})

describe('createItem', () => {
  it('creates an item with the given text', () => {
    const item = createItem('Hello')
    expect(item.id).toBeTruthy()
    expect(item.text).toBe('Hello')
    expect(item.createdAt).toBeGreaterThan(0)
  })

  it('uses explicit coordinates when provided', () => {
    const item = createItem('Test', 50, 75)
    expect(item.x).toBe(50)
    expect(item.y).toBe(75)
  })

  it('generates random coordinates when not provided', () => {
    const item = createItem('Random')
    expect(item.x).toBeGreaterThanOrEqual(10)
    expect(item.x).toBeLessThanOrEqual(70)
    expect(item.y).toBeGreaterThanOrEqual(10)
    expect(item.y).toBeLessThanOrEqual(60)
  })
})

// RFCTR-009: the drop-geometry rules moved here from useDragAndDrop so both
// halves of the position-envelope decision live beside each other in the core.

function rect(left: number, top: number, width: number, height: number): DOMRect {
  return { left, top, right: left + width, bottom: top + height, width, height } as DOMRect
}

describe('clientToContainerPoint', () => {
  it('maps a client point into container-local coordinates', () => {
    // A container whose client rect starts at (40, 60) — e.g. panned into view
    // under pinch zoom, where rects and pointer coords share the offset.
    expect(clientToContainerPoint(100, 200, { left: 40, top: 60 })).toEqual({ x: 60, y: 140 })
  })

  it('is the identity for a container at the client origin', () => {
    expect(clientToContainerPoint(90, 190, { left: 0, top: 0 })).toEqual({ x: 90, y: 190 })
  })

  it('yields negative coordinates for points above/left of the container', () => {
    expect(clientToContainerPoint(10, 20, { left: 40, top: 60 })).toEqual({ x: -30, y: -40 })
  })
})

describe('clientToQuadrantPercent', () => {
  const bounds = rect(100, 200, 400, 300)

  it('converts client coordinates to percentage within the rect', () => {
    const result = clientToQuadrantPercent(300, 350, bounds)
    // (300-100)/400*100 = 50, (350-200)/300*100 = 50
    expect(result.x).toBe(50)
    expect(result.y).toBe(50)
  })

  it('clamps x to minimum of 2', () => {
    const result = clientToQuadrantPercent(100, 350, bounds)
    // (0)/400*100 = 0, clamped to 2
    expect(result.x).toBe(2)
  })

  it('clamps x to maximum of 85', () => {
    const result = clientToQuadrantPercent(600, 350, bounds)
    // (500)/400*100 = 125, clamped to 85
    expect(result.x).toBe(85)
  })

  it('clamps y to minimum of 2', () => {
    const result = clientToQuadrantPercent(300, 200, bounds)
    expect(result.y).toBe(2)
  })

  it('clamps y to maximum of 85', () => {
    const result = clientToQuadrantPercent(300, 600, bounds)
    expect(result.y).toBe(85)
  })

  it('handles exact boundary values', () => {
    // At left+2% of width, top+2% of height
    const result = clientToQuadrantPercent(108, 206, bounds)
    expect(result.x).toBe(2)
    expect(result.y).toBe(2)
  })
})

describe('getQuadrantAtPoint', () => {
  const quadrantRects = [rect(0, 0, 200, 200), rect(200, 0, 200, 200), rect(0, 200, 200, 200), rect(200, 200, 200, 200)]
  const canvasRects = [rect(0, 30, 200, 170), rect(200, 30, 200, 170), rect(0, 230, 200, 170), rect(200, 230, 200, 170)]

  it('returns the correct quadrant index for a point inside it', () => {
    const result = getQuadrantAtPoint(100, 100, quadrantRects, canvasRects)
    expect(result).not.toBeNull()
    expect(result!.index).toBe(0)
  })

  it('returns the canvas rect (not the quadrant rect) for the hit', () => {
    const result = getQuadrantAtPoint(100, 100, quadrantRects, canvasRects)
    expect(result!.rect.top).toBe(30)
    expect(result!.rect.height).toBe(170)
  })

  it('returns quadrant 1 for a point in the top-right', () => {
    const result = getQuadrantAtPoint(300, 100, quadrantRects, canvasRects)
    expect(result!.index).toBe(1)
  })

  it('returns quadrant 3 for a point in the bottom-right', () => {
    const result = getQuadrantAtPoint(300, 300, quadrantRects, canvasRects)
    expect(result!.index).toBe(3)
  })

  it('returns null when point is outside all quadrants', () => {
    const result = getQuadrantAtPoint(500, 500, quadrantRects, canvasRects)
    expect(result).toBeNull()
  })

  it('handles null rects gracefully', () => {
    const result = getQuadrantAtPoint(100, 100, [null, null, null, null], canvasRects)
    expect(result).toBeNull()
  })

  it('falls back to the quadrant rect when the canvas rect is null', () => {
    const result = getQuadrantAtPoint(100, 100, quadrantRects, [null, null, null, null])
    expect(result).not.toBeNull()
    expect(result!.rect.top).toBe(0)
    expect(result!.rect.height).toBe(200)
  })
})

describe('moveTargetsFrom', () => {
  it('offers every other quadrant as a target, carrying its label and index', () => {
    const fw = makeFramework()
    expect(moveTargetsFrom(fw.quadrants, 0)).toEqual([
      { label: 'B', index: 1 },
      { label: 'C', index: 2 },
      { label: 'D', index: 3 },
    ])
  })

  it('never offers the quadrant the item is already in', () => {
    const fw = makeFramework()
    expect(moveTargetsFrom(fw.quadrants, 2).map((t) => t.index)).toEqual([0, 1, 3])
  })
})
