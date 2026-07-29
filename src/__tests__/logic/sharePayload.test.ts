import { describe, it, expect } from 'vitest'
import { toSharedPayload, isValidPayload, composeShareUrl } from '../../logic/sharePayload'
import type { Framework, SharedPayload } from '../../types'

function makeFramework(overrides: Partial<Framework> = {}): Framework {
  return {
    id: 'test-id',
    name: 'Test Framework',
    axisX: 'X Axis',
    axisY: 'Y Axis',
    quadrants: [
      { label: 'Q1', color: '#fbbf24', items: [{ id: 'i1', text: 'Item 1', x: 10, y: 20, createdAt: 1000 }] },
      { label: 'Q2', color: '#60a5fa', items: [] },
      { label: 'Q3', color: '#34d399', items: [] },
      { label: 'Q4', color: '#f472b6', items: [] },
    ],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

function makePayload(): SharedPayload {
  return {
    id: 'p-1',
    name: 'Shared',
    axisX: 'X',
    axisY: 'Y',
    quadrants: [
      { label: 'Q1', color: '#fbbf24', items: [{ text: 'Item', x: 10, y: 20 }] },
      { label: 'Q2', color: '#60a5fa', items: [] },
      { label: 'Q3', color: '#34d399', items: [] },
      { label: 'Q4', color: '#f472b6', items: [] },
    ],
  }
}

describe('toSharedPayload', () => {
  it('projects a framework keeping id, name, axes, labels, colors, and item positions', () => {
    const payload = toSharedPayload(makeFramework())
    expect(payload.id).toBe('test-id')
    expect(payload.name).toBe('Test Framework')
    expect(payload.axisX).toBe('X Axis')
    expect(payload.axisY).toBe('Y Axis')
    expect(payload.quadrants).toHaveLength(4)
    expect(payload.quadrants[0]).toEqual({
      label: 'Q1',
      color: '#fbbf24',
      items: [{ text: 'Item 1', x: 10, y: 20 }],
    })
  })

  it('strips framework timestamps and item ids/timestamps', () => {
    const payload = toSharedPayload(makeFramework())
    expect(payload).not.toHaveProperty('createdAt')
    expect(payload).not.toHaveProperty('updatedAt')
    expect(payload.quadrants[0].items[0]).not.toHaveProperty('id')
    expect(payload.quadrants[0].items[0]).not.toHaveProperty('createdAt')
  })
})

describe('isValidPayload', () => {
  it('accepts a valid payload', () => {
    expect(isValidPayload(makePayload())).toBe(true)
  })

  it('rejects non-object values', () => {
    expect(isValidPayload(null)).toBe(false)
    expect(isValidPayload('string')).toBe(false)
    expect(isValidPayload(42)).toBe(false)
  })

  it('rejects a payload with a missing or empty id', () => {
    expect(isValidPayload({ ...makePayload(), id: undefined })).toBe(false)
    expect(isValidPayload({ ...makePayload(), id: '' })).toBe(false)
  })

  it('rejects a payload with a missing or empty name', () => {
    expect(isValidPayload({ ...makePayload(), name: undefined })).toBe(false)
    expect(isValidPayload({ ...makePayload(), name: '' })).toBe(false)
  })

  it('rejects a payload without exactly 4 quadrants', () => {
    const p = makePayload()
    expect(isValidPayload({ ...p, quadrants: p.quadrants.slice(0, 3) })).toBe(false)
    expect(isValidPayload({ ...p, quadrants: 'nope' })).toBe(false)
  })

  it('rejects a quadrant with a non-string label', () => {
    const p = makePayload()
    p.quadrants[0] = { ...p.quadrants[0], label: 7 as unknown as string }
    expect(isValidPayload(p)).toBe(false)
  })

  it('rejects a quadrant with a non-string color (BUG-017)', () => {
    const p = makePayload()
    p.quadrants[0] = { ...p.quadrants[0], color: 42 as unknown as string }
    expect(isValidPayload(p)).toBe(false)
  })

  it('tolerates a quadrant with no color or items fields', () => {
    const p = makePayload()
    p.quadrants[1] = { label: 'Bare' } as unknown as SharedPayload['quadrants'][number]
    expect(isValidPayload(p)).toBe(true)
  })

  it('rejects malformed items', () => {
    const p = makePayload()
    p.quadrants[0] = {
      ...p.quadrants[0],
      items: [{ text: 42, x: 1, y: 2 }] as unknown as SharedPayload['quadrants'][number]['items'],
    }
    expect(isValidPayload(p)).toBe(false)

    const q = makePayload()
    q.quadrants[0] = {
      ...q.quadrants[0],
      items: [{ text: 'ok', x: 'left', y: 2 }] as unknown as SharedPayload['quadrants'][number]['items'],
    }
    expect(isValidPayload(q)).toBe(false)
  })
})

// RFCTR-012: the share link is the routing adapter's URL plus the payload
// hash; its shape is pinned here with literals so it cannot silently regress.
describe('composeShareUrl', () => {
  it('composes origin, root base, and hash', () => {
    expect(composeShareUrl('https://example.com', '/', 'abc123')).toBe('https://example.com/#abc123')
  })

  it('composes under a non-root base without doubling or dropping separators', () => {
    expect(composeShareUrl('https://user.github.io', '/quadrants/', 'abc123')).toBe(
      'https://user.github.io/quadrants/#abc123',
    )
  })
})
