import { describe, it, expect } from 'vitest'
import { resolveImportAction } from '../../logic/shareImport'
import type { Framework, SharedPayload } from '../../types'

function makePayload(overrides: Partial<SharedPayload> = {}): SharedPayload {
  return {
    id: 'fw-1',
    name: 'Test',
    axisX: 'x',
    axisY: 'y',
    quadrants: [
      { label: 'A', color: '#aaaaaa', items: [{ text: 'item', x: 10, y: 10 }] },
      { label: 'B', color: '#bbbbbb', items: [] },
      { label: 'C', color: '#cccccc', items: [] },
      { label: 'D', color: '#dddddd', items: [] },
    ],
    ...overrides,
  }
}

function makeExisting(overrides: Partial<Framework> = {}): Framework {
  return {
    id: 'fw-1',
    name: 'Test',
    axisX: 'x',
    axisY: 'y',
    quadrants: [
      { label: 'A', color: '#aaaaaa', items: [{ id: 'a', text: 'item', x: 10, y: 10, createdAt: 1000 }] },
      { label: 'B', color: '#bbbbbb', items: [] },
      { label: 'C', color: '#cccccc', items: [] },
      { label: 'D', color: '#dddddd', items: [] },
    ],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

describe('resolveImportAction', () => {
  it('returns an "add" action when no existing framework is found', () => {
    const payload = makePayload()
    const action = resolveImportAction(payload, null)
    expect(action.kind).toBe('add')
    if (action.kind !== 'add') return
    expect(action.framework.id).toBe('fw-1')
    expect(action.framework.name).toBe('Test')
  })

  it('returns a "navigate" action when payload matches existing framework', () => {
    const payload = makePayload()
    const existing = makeExisting()
    const action = resolveImportAction(payload, existing)
    expect(action).toEqual({ kind: 'navigate', id: 'fw-1' })
  })

  it('returns a "conflict" action when payload and existing differ', () => {
    const payload = makePayload({ name: 'Updated name' })
    const existing = makeExisting()
    const action = resolveImportAction(payload, existing)
    expect(action.kind).toBe('conflict')
    if (action.kind !== 'conflict') return
    expect(action.existing).toBe(existing)
    expect(action.incoming.id).toBe('fw-1')
    expect(action.incoming.name).toBe('Updated name')
  })
})
