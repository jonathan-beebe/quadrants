import { describe, it, expect } from 'vitest'
import { addItem, removeItem, updateItemText, moveItem, setQuadrantColor } from '../../logic/items'
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
