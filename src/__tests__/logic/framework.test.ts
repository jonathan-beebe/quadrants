import { describe, it, expect } from 'vitest'
import {
  hydratePayload,
  updateFramework,
  deleteFramework,
  duplicateFramework,
  applyTemplateEdit,
  frameworksMatch,
  duplicateAsImport,
  replaceFramework,
} from '../../logic/framework'
import type { Framework, SharedPayload } from '../../types'

function makeFramework(overrides: Partial<Framework> = {}): Framework {
  return {
    id: 'fw-1',
    name: 'Test',
    axisX: '',
    axisY: '',
    quadrants: [
      { label: 'A', color: '#fbbf24', items: [{ id: 'i1', text: 'Item 1', x: 10, y: 20, createdAt: 1000 }] },
      { label: 'B', color: '#60a5fa', items: [] },
      { label: 'C', color: '#34d399', items: [] },
      { label: 'D', color: '#f472b6', items: [] },
    ],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

function makePayload(): SharedPayload {
  return {
    id: 'fw-1',
    name: 'Shared',
    axisX: 'X',
    axisY: 'Y',
    quadrants: [
      { label: 'Q1', color: '#fbbf24', items: [{ text: 'Shared item', x: 15, y: 25 }] },
      { label: 'Q2', color: '#60a5fa', items: [] },
      { label: 'Q3', color: '#34d399', items: [] },
      { label: 'Q4', color: '#f472b6', items: [] },
    ],
  }
}

describe('hydratePayload', () => {
  it('creates a full Framework from a SharedPayload', () => {
    const fw = hydratePayload(makePayload(), 'new-id')
    expect(fw.id).toBe('new-id')
    expect(fw.name).toBe('Shared')
    expect(fw.axisX).toBe('X')
    expect(fw.axisY).toBe('Y')
    expect(fw.quadrants).toHaveLength(4)
    expect(fw.quadrants[0].items[0].text).toBe('Shared item')
    expect(fw.quadrants[0].items[0].id).toBeTruthy()
    expect(fw.createdAt).toBeGreaterThan(0)
  })

  it('defaults missing colors to defaultColors', () => {
    const payload = makePayload()
    payload.quadrants[0].color = ''
    const fw = hydratePayload(payload, 'id')
    expect(fw.quadrants[0].color).toBe('#fbbf24')
  })

  it('defaults missing item coordinates to 10', () => {
    const payload = makePayload()
    // @ts-expect-error - testing missing coords
    payload.quadrants[0].items = [{ text: 'No coords' }]
    const fw = hydratePayload(payload, 'id')
    expect(fw.quadrants[0].items[0].x).toBe(10)
    expect(fw.quadrants[0].items[0].y).toBe(10)
  })

  it('clamps item coordinates to valid range (2-85)', () => {
    const payload = makePayload()
    payload.quadrants[0].items = [
      { text: 'Too high', x: 9999, y: 200 },
      { text: 'Too low', x: -500, y: -10 },
      { text: 'In range', x: 50, y: 50 },
    ]
    const fw = hydratePayload(payload, 'id')
    expect(fw.quadrants[0].items[0].x).toBe(85)
    expect(fw.quadrants[0].items[0].y).toBe(85)
    expect(fw.quadrants[0].items[1].x).toBe(2)
    expect(fw.quadrants[0].items[1].y).toBe(2)
    expect(fw.quadrants[0].items[2].x).toBe(50)
    expect(fw.quadrants[0].items[2].y).toBe(50)
  })
})

describe('updateFramework', () => {
  it('replaces the matching framework and updates timestamp', () => {
    const frameworks = [makeFramework(), makeFramework({ id: 'fw-2', name: 'Other' })]
    const updated = { ...frameworks[0], name: 'Updated' }
    const result = updateFramework(frameworks, updated)
    expect(result[0].name).toBe('Updated')
    expect(result[0].updatedAt).toBeGreaterThan(1000)
    expect(result[1].name).toBe('Other')
  })

  it('leaves other frameworks unchanged', () => {
    const fw1 = makeFramework()
    const fw2 = makeFramework({ id: 'fw-2' })
    const result = updateFramework([fw1, fw2], { ...fw1, name: 'Changed' })
    expect(result[1]).toBe(fw2)
  })
})

describe('deleteFramework', () => {
  it('removes the framework with the given id', () => {
    const frameworks = [makeFramework(), makeFramework({ id: 'fw-2' })]
    const result = deleteFramework(frameworks, 'fw-1')
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('fw-2')
  })

  it('returns the same array if id not found', () => {
    const frameworks = [makeFramework()]
    const result = deleteFramework(frameworks, 'nonexistent')
    expect(result).toHaveLength(1)
  })
})

describe('duplicateFramework', () => {
  it('creates a deep copy with new id and "(copy)" suffix', () => {
    const fw = makeFramework()
    const dup = duplicateFramework(fw)
    expect(dup.id).not.toBe(fw.id)
    expect(dup.name).toBe('Test (copy)')
    expect(dup.quadrants[0].items[0].text).toBe('Item 1')
  })

  it('produces an independent copy (no shared references)', () => {
    const fw = makeFramework()
    const dup = duplicateFramework(fw)
    dup.quadrants[0].items[0].text = 'Modified'
    expect(fw.quadrants[0].items[0].text).toBe('Item 1')
  })
})

describe('applyTemplateEdit', () => {
  it('updates name, axes, and quadrant labels', () => {
    const fw = makeFramework()
    const result = applyTemplateEdit(fw, {
      name: 'New Name',
      axisX: 'Horizontal',
      axisY: 'Vertical',
      quadrants: ['W', 'X', 'Y', 'Z'],
    })
    expect(result.name).toBe('New Name')
    expect(result.axisX).toBe('Horizontal')
    expect(result.axisY).toBe('Vertical')
    expect(result.quadrants[0].label).toBe('W')
    expect(result.quadrants[3].label).toBe('Z')
  })

  it('preserves existing items when editing labels', () => {
    const fw = makeFramework()
    const result = applyTemplateEdit(fw, {
      name: 'Edited',
      axisX: '',
      axisY: '',
      quadrants: ['New A', 'New B', 'New C', 'New D'],
    })
    expect(result.quadrants[0].items).toHaveLength(1)
    expect(result.quadrants[0].items[0].text).toBe('Item 1')
  })
})

describe('frameworksMatch', () => {
  function makeMatchingFramework(): Framework {
    return makeFramework({
      name: 'Shared',
      axisX: 'X',
      axisY: 'Y',
      quadrants: [
        { label: 'Q1', color: '#fbbf24', items: [{ id: 'i1', text: 'Shared item', x: 15, y: 25, createdAt: 1000 }] },
        { label: 'Q2', color: '#60a5fa', items: [] },
        { label: 'Q3', color: '#34d399', items: [] },
        { label: 'Q4', color: '#f472b6', items: [] },
      ],
    })
  }

  it('returns true when name, axes, labels, and items match', () => {
    expect(frameworksMatch(makeMatchingFramework(), makePayload())).toBe(true)
  })

  it('returns false when names differ', () => {
    const fw = makeMatchingFramework()
    fw.name = 'Different'
    expect(frameworksMatch(fw, makePayload())).toBe(false)
  })

  it('returns false when axis labels differ', () => {
    const fw = makeMatchingFramework()
    fw.axisX = 'Different Axis'
    expect(frameworksMatch(fw, makePayload())).toBe(false)
  })

  it('returns false when item counts differ', () => {
    const fw = makeMatchingFramework()
    fw.quadrants[0].items.push({ id: 'extra', text: 'Extra', x: 0, y: 0, createdAt: 0 })
    expect(frameworksMatch(fw, makePayload())).toBe(false)
  })

  it('returns false when item text differs', () => {
    const fw = makeMatchingFramework()
    fw.quadrants[0].items[0].text = 'Edited locally'
    expect(frameworksMatch(fw, makePayload())).toBe(false)
  })

  it('returns false when item coordinates differ', () => {
    const fw = makeMatchingFramework()
    fw.quadrants[0].items[0].x = 99
    expect(frameworksMatch(fw, makePayload())).toBe(false)
  })

  it('ignores metadata fields like createdAt and item ids', () => {
    const fw = makeMatchingFramework()
    fw.quadrants[0].items[0].id = 'different-id'
    fw.quadrants[0].items[0].createdAt = 9999
    expect(frameworksMatch(fw, makePayload())).toBe(true)
  })
})

describe('duplicateAsImport', () => {
  it('creates a copy with new id and "(imported)" suffix', () => {
    const fw = makeFramework()
    const result = duplicateAsImport(fw)
    expect(result.id).not.toBe(fw.id)
    expect(result.name).toBe('Test (imported)')
  })
})

describe('replaceFramework', () => {
  it('replaces the matching framework in the list', () => {
    const frameworks = [makeFramework(), makeFramework({ id: 'fw-2', name: 'Keep' })]
    const incoming = { ...makeFramework(), name: 'Replaced' }
    const result = replaceFramework(frameworks, incoming)
    expect(result[0].name).toBe('Replaced')
    expect(result[1].name).toBe('Keep')
  })
})
