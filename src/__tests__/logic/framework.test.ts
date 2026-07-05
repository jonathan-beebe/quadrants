import { describe, it, expect } from 'vitest'
import {
  frameworkFromPayload,
  updateFramework,
  deleteFramework,
  duplicateFramework,
  applyTemplateEdit,
  frameworkMatchesPayload,
  duplicateAsImport,
  replaceFramework,
  repairImportedFramework,
  filterValidFrameworks,
  createFramework,
} from '../../logic/framework'
import type { Framework, FrameworkTemplate, SharedPayload } from '../../types'

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

describe('frameworkFromPayload', () => {
  it('creates a full Framework from a SharedPayload', () => {
    const fw = frameworkFromPayload(makePayload(), 'new-id')
    expect(fw.id).toBe('new-id')
    expect(fw.name).toBe('Shared')
    expect(fw.axisX).toBe('X')
    expect(fw.axisY).toBe('Y')
    expect(fw.quadrants).toHaveLength(4)
    expect(fw.quadrants[0].items[0].text).toBe('Shared item')
    expect(fw.quadrants[0].items[0].id).toBeTruthy()
    expect(fw.createdAt).toBeGreaterThan(0)
  })

  it('replaces non-#rrggbb colors with defaultColors (BUG-006)', () => {
    const payload = makePayload()
    payload.quadrants[0].color = 'red'
    payload.quadrants[1].color = '#abc'
    payload.quadrants[2].color = 'rgb(255,0,0)'
    const fw = frameworkFromPayload(payload, 'id')
    expect(fw.quadrants[0].color).toBe('#fbbf24')
    expect(fw.quadrants[1].color).toBe('#60a5fa')
    expect(fw.quadrants[2].color).toBe('#34d399')
    expect(fw.quadrants[3].color).toBe('#f472b6')
  })

  it('defaults missing colors to defaultColors', () => {
    const payload = makePayload()
    payload.quadrants[0].color = ''
    const fw = frameworkFromPayload(payload, 'id')
    expect(fw.quadrants[0].color).toBe('#fbbf24')
  })

  it('defaults missing item coordinates to 10', () => {
    const payload = makePayload()
    // @ts-expect-error - testing missing coords
    payload.quadrants[0].items = [{ text: 'No coords' }]
    const fw = frameworkFromPayload(payload, 'id')
    expect(fw.quadrants[0].items[0].x).toBe(10)
    expect(fw.quadrants[0].items[0].y).toBe(10)
  })

  it('clamps item coordinates to the app-reachable range (0-95)', () => {
    const payload = makePayload()
    payload.quadrants[0].items = [
      { text: 'Too high', x: 9999, y: 200 },
      { text: 'Too low', x: -500, y: -10 },
      { text: 'In range', x: 50, y: 50 },
    ]
    const fw = frameworkFromPayload(payload, 'id')
    expect(fw.quadrants[0].items[0].x).toBe(95)
    expect(fw.quadrants[0].items[0].y).toBe(95)
    expect(fw.quadrants[0].items[1].x).toBe(0)
    expect(fw.quadrants[0].items[1].y).toBe(0)
    expect(fw.quadrants[0].items[2].x).toBe(50)
    expect(fw.quadrants[0].items[2].y).toBe(50)
  })

  it('preserves positions reachable via keyboard repositioning (BUG-007)', () => {
    const payload = makePayload()
    payload.quadrants[0].items = [{ text: 'Keyboard edge', x: 95, y: 0 }]
    const fw = frameworkFromPayload(payload, 'id')
    expect(fw.quadrants[0].items[0].x).toBe(95)
    expect(fw.quadrants[0].items[0].y).toBe(0)
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

describe('frameworkMatchesPayload', () => {
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
    expect(frameworkMatchesPayload(makeMatchingFramework(), makePayload())).toBe(true)
  })

  it('returns false when names differ', () => {
    const fw = makeMatchingFramework()
    fw.name = 'Different'
    expect(frameworkMatchesPayload(fw, makePayload())).toBe(false)
  })

  it('returns false when axis labels differ', () => {
    const fw = makeMatchingFramework()
    fw.axisX = 'Different Axis'
    expect(frameworkMatchesPayload(fw, makePayload())).toBe(false)
  })

  it('returns false when item counts differ', () => {
    const fw = makeMatchingFramework()
    fw.quadrants[0].items.push({ id: 'extra', text: 'Extra', x: 0, y: 0, createdAt: 0 })
    expect(frameworkMatchesPayload(fw, makePayload())).toBe(false)
  })

  it('returns false when item text differs', () => {
    const fw = makeMatchingFramework()
    fw.quadrants[0].items[0].text = 'Edited locally'
    expect(frameworkMatchesPayload(fw, makePayload())).toBe(false)
  })

  it('returns false when item coordinates differ', () => {
    const fw = makeMatchingFramework()
    fw.quadrants[0].items[0].x = 99
    expect(frameworkMatchesPayload(fw, makePayload())).toBe(false)
  })

  it('returns false when quadrant colors differ', () => {
    const fw = makeMatchingFramework()
    fw.quadrants[0].color = '#000000'
    expect(frameworkMatchesPayload(fw, makePayload())).toBe(false)
  })

  it('ignores metadata fields like createdAt and item ids', () => {
    const fw = makeMatchingFramework()
    fw.quadrants[0].items[0].id = 'different-id'
    fw.quadrants[0].items[0].createdAt = 9999
    expect(frameworkMatchesPayload(fw, makePayload())).toBe(true)
  })

  it('matches when payload coordinates are out of range but clamp to the stored values (BUG-007)', () => {
    // Re-importing the same link must navigate, not raise a false conflict:
    // the stored copy holds clamped coordinates while the payload holds raw ones.
    const fw = makeMatchingFramework()
    fw.quadrants[0].items[0].x = 95
    fw.quadrants[0].items[0].y = 0
    const payload = makePayload()
    payload.quadrants[0].items[0] = { text: 'Shared item', x: 300, y: -50 }
    expect(frameworkMatchesPayload(fw, payload)).toBe(true)
  })

  it('still reports a mismatch for genuinely different in-range coordinates', () => {
    const fw = makeMatchingFramework()
    const payload = makePayload()
    payload.quadrants[0].items[0] = { text: 'Shared item', x: 50, y: 25 }
    expect(frameworkMatchesPayload(fw, payload)).toBe(false)
  })
})

describe('duplicateAsImport', () => {
  it('creates a copy with new id and "(imported)" suffix', () => {
    const fw = makeFramework()
    const result = duplicateAsImport(fw)
    expect(result.id).not.toBe(fw.id)
    expect(result.name).toBe('Test (imported)')
  })

  it('produces an independent copy (no shared nested references)', () => {
    const fw = makeFramework()
    const dup = duplicateAsImport(fw)
    expect(dup.quadrants).not.toBe(fw.quadrants)
    expect(dup.quadrants[0]).not.toBe(fw.quadrants[0])
    expect(dup.quadrants[0].items).not.toBe(fw.quadrants[0].items)
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

describe('repairImportedFramework', () => {
  const validRaw = {
    name: 'My Framework',
    axisX: 'Urgency',
    axisY: 'Importance',
    quadrants: [
      { label: 'Do First', color: '#fbbf24', items: [{ text: 'Task', x: 25, y: 30 }] },
      { label: 'Schedule', color: '#60a5fa', items: [] },
      { label: 'Delegate', color: '#34d399', items: [] },
      { label: 'Eliminate', color: '#f472b6', items: [] },
    ],
  }

  it('returns null for null/undefined/non-object input', () => {
    expect(repairImportedFramework(null)).toBeNull()
    expect(repairImportedFramework(undefined)).toBeNull()
    expect(repairImportedFramework('string')).toBeNull()
  })

  it('returns null when name is missing or empty', () => {
    expect(repairImportedFramework({ ...validRaw, name: '' })).toBeNull()
    expect(repairImportedFramework({ ...validRaw, name: 42 })).toBeNull()
  })

  it('returns null when quadrants is not an array of 4', () => {
    expect(repairImportedFramework({ ...validRaw, quadrants: [] })).toBeNull()
    expect(repairImportedFramework({ ...validRaw, quadrants: [{ label: 'A' }] })).toBeNull()
  })

  it('accepts a valid framework as-is', () => {
    const result = repairImportedFramework(validRaw)!
    expect(result).not.toBeNull()
    expect(result.name).toBe('My Framework')
    expect(result.axisX).toBe('Urgency')
    expect(result.quadrants).toHaveLength(4)
    expect(result.quadrants[0].label).toBe('Do First')
    expect(result.quadrants[0].items).toHaveLength(1)
    expect(result.quadrants[0].items[0].text).toBe('Task')
    expect(result.quadrants[0].items[0].x).toBe(25)
    expect(result.quadrants[0].items[0].y).toBe(30)
    expect(result.id).toBeTruthy()
  })

  it('defaults missing quadrant labels', () => {
    const raw = {
      ...validRaw,
      quadrants: validRaw.quadrants.map((q) => ({ ...q, label: undefined })),
    }
    const result = repairImportedFramework(raw)!
    expect(result.quadrants[0].label).toBe('Quadrant 1')
    expect(result.quadrants[3].label).toBe('Quadrant 4')
  })

  it('defaults missing quadrant colors to defaultColors', () => {
    const raw = {
      ...validRaw,
      quadrants: validRaw.quadrants.map((q) => ({ ...q, color: undefined })),
    }
    const result = repairImportedFramework(raw)!
    expect(result.quadrants[0].color).toBe('#fbbf24')
    expect(result.quadrants[1].color).toBe('#60a5fa')
  })

  it('replaces non-#rrggbb colors with defaultColors (BUG-006)', () => {
    const raw = {
      ...validRaw,
      quadrants: [
        { label: 'A', color: 'red', items: [] },
        { label: 'B', color: '#abc', items: [] },
        { label: 'C', color: 'rgb(255,0,0)', items: [] },
        { label: 'D', color: '#34D399', items: [] },
      ],
    }
    const result = repairImportedFramework(raw)!
    expect(result.quadrants[0].color).toBe('#fbbf24')
    expect(result.quadrants[1].color).toBe('#60a5fa')
    expect(result.quadrants[2].color).toBe('#34d399')
    expect(result.quadrants[3].color).toBe('#34D399')
  })

  it('defaults missing items array to empty', () => {
    const raw = {
      ...validRaw,
      quadrants: validRaw.quadrants.map((q) => ({ ...q, items: undefined })),
    }
    const result = repairImportedFramework(raw)!
    expect(result.quadrants[0].items).toEqual([])
  })

  it('defaults missing x/y on items to 10', () => {
    const raw = {
      ...validRaw,
      quadrants: [
        { label: 'A', color: '#fff', items: [{ text: 'No coords' }] },
        { label: 'B', color: '#fff', items: [] },
        { label: 'C', color: '#fff', items: [] },
        { label: 'D', color: '#fff', items: [] },
      ],
    }
    const result = repairImportedFramework(raw)!
    expect(result.quadrants[0].items[0].x).toBe(10)
    expect(result.quadrants[0].items[0].y).toBe(10)
  })

  it('filters out items without text', () => {
    const raw = {
      ...validRaw,
      quadrants: [
        { label: 'A', color: '#fff', items: [{ text: 'Good' }, { x: 5 }, null, { text: 'Also good' }] },
        { label: 'B', color: '#fff', items: [] },
        { label: 'C', color: '#fff', items: [] },
        { label: 'D', color: '#fff', items: [] },
      ],
    }
    const result = repairImportedFramework(raw)!
    expect(result.quadrants[0].items).toHaveLength(2)
    expect(result.quadrants[0].items[0].text).toBe('Good')
    expect(result.quadrants[0].items[1].text).toBe('Also good')
  })

  it('generates id for items missing one', () => {
    const result = repairImportedFramework(validRaw)!
    expect(result.quadrants[0].items[0].id).toBeTruthy()
  })

  it('defaults axisX/axisY to empty string when missing', () => {
    const raw = { ...validRaw, axisX: undefined, axisY: undefined }
    const result = repairImportedFramework(raw)!
    expect(result.axisX).toBe('')
    expect(result.axisY).toBe('')
  })
})

describe('filterValidFrameworks', () => {
  it('returns an empty array for non-array input', () => {
    expect(filterValidFrameworks('hello')).toEqual([])
    expect(filterValidFrameworks(null)).toEqual([])
    expect(filterValidFrameworks({})).toEqual([])
  })

  it('keeps fully well-formed frameworks', () => {
    const fw = makeFramework()
    expect(filterValidFrameworks([fw])).toEqual([fw])
  })

  it('drops frameworks whose quadrants are not objects', () => {
    // This shape passes the old shallow check but crashes Sidebar at render.
    const broken = { id: 'x', name: 'Broken', quadrants: [1, 2, 3, 4] }
    expect(filterValidFrameworks([broken])).toEqual([])
  })

  it('drops frameworks with a quadrant missing its items array', () => {
    const fw = makeFramework()
    const broken = {
      ...fw,
      quadrants: [{ label: 'A', color: '#fff' }, ...fw.quadrants.slice(1)],
    }
    expect(filterValidFrameworks([broken])).toEqual([])
  })

  it('drops frameworks with a quadrant missing its label', () => {
    const fw = makeFramework()
    const broken = {
      ...fw,
      quadrants: [{ color: '#fff', items: [] }, ...fw.quadrants.slice(1)],
    }
    expect(filterValidFrameworks([broken])).toEqual([])
  })

  it('drops frameworks containing malformed items', () => {
    const fw = makeFramework()
    const broken = {
      ...fw,
      quadrants: [{ label: 'A', color: '#fff', items: [{ id: 'i1', text: 42, x: 1, y: 1 }] }, ...fw.quadrants.slice(1)],
    }
    expect(filterValidFrameworks([broken])).toEqual([])
  })

  it('drops frameworks without exactly 4 quadrants', () => {
    const fw = makeFramework()
    const broken = { ...fw, quadrants: fw.quadrants.slice(0, 3) }
    expect(filterValidFrameworks([broken])).toEqual([])
  })

  it('keeps valid frameworks while dropping invalid ones from a mixed list', () => {
    const valid = makeFramework()
    const invalid = { id: 2, name: 'bad', quadrants: 'nope' }
    expect(filterValidFrameworks([valid, invalid])).toEqual([valid])
  })
})

describe('createFramework', () => {
  it('creates a framework from a template', () => {
    const template: FrameworkTemplate = {
      name: 'Test Framework',
      axisX: 'X',
      axisY: 'Y',
      quadrants: ['Q1', 'Q2', 'Q3', 'Q4'],
    }
    const fw = createFramework(template)

    expect(fw.id).toBeTruthy()
    expect(fw.name).toBe('Test Framework')
    expect(fw.axisX).toBe('X')
    expect(fw.axisY).toBe('Y')
    expect(fw.quadrants).toHaveLength(4)
    expect(fw.quadrants[0].label).toBe('Q1')
    expect(fw.quadrants[0].items).toEqual([])
    expect(fw.createdAt).toBeGreaterThan(0)
    expect(fw.updatedAt).toBe(fw.createdAt)
  })

  it('uses default colors when template has none', () => {
    const template: FrameworkTemplate = {
      name: 'No Colors',
      axisX: '',
      axisY: '',
      quadrants: ['A', 'B', 'C', 'D'],
    }
    const fw = createFramework(template)
    expect(fw.quadrants[0].color).toBe('#fbbf24')
    expect(fw.quadrants[1].color).toBe('#60a5fa')
  })

  it('uses custom colors when provided', () => {
    const template: FrameworkTemplate = {
      name: 'Custom',
      axisX: '',
      axisY: '',
      quadrants: ['A', 'B', 'C', 'D'],
      colors: ['#111111', '#222222', '#333333', '#444444'],
    }
    const fw = createFramework(template)
    expect(fw.quadrants[0].color).toBe('#111111')
    expect(fw.quadrants[3].color).toBe('#444444')
  })

  it('defaults empty axis labels to empty string', () => {
    const template: FrameworkTemplate = {
      name: 'Test',
      axisX: '',
      axisY: '',
      quadrants: ['A', 'B', 'C', 'D'],
    }
    const fw = createFramework(template)
    expect(fw.axisX).toBe('')
    expect(fw.axisY).toBe('')
  })
})
