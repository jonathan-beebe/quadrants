import { describe, it, expect } from 'vitest'
import { initHistory, commit, undo, redo, canUndo, canRedo, HISTORY_LIMIT } from '../../logic/history'

describe('history', () => {
  it('starts with no past and no future', () => {
    const h = initHistory('a')
    expect(h.present).toBe('a')
    expect(canUndo(h)).toBe(false)
    expect(canRedo(h)).toBe(false)
  })

  it('commit records the previous present and clears the future', () => {
    let h = initHistory('a')
    h = commit(h, 'b')
    expect(h.present).toBe('b')
    expect(canUndo(h)).toBe(true)

    h = undo(h)
    expect(canRedo(h)).toBe(true)

    h = commit(h, 'c')
    expect(h.present).toBe('c')
    expect(canRedo(h)).toBe(false)
  })

  it('undo and redo walk the history in order', () => {
    let h = initHistory('a')
    h = commit(h, 'b')
    h = commit(h, 'c')

    h = undo(h)
    expect(h.present).toBe('b')
    h = undo(h)
    expect(h.present).toBe('a')

    h = redo(h)
    expect(h.present).toBe('b')
    h = redo(h)
    expect(h.present).toBe('c')
  })

  it('undo with no past and redo with no future are no-ops', () => {
    const h = initHistory('a')
    expect(undo(h)).toBe(h)
    expect(redo(h)).toBe(h)
  })

  it('committing the same reference is a no-op', () => {
    const h = initHistory('a')
    expect(commit(h, 'a')).toBe(h)
  })

  it('drops the oldest entries beyond the history limit', () => {
    let h = initHistory(0)
    for (let i = 1; i <= HISTORY_LIMIT + 10; i++) {
      h = commit(h, i)
    }
    let steps = 0
    while (canUndo(h)) {
      h = undo(h)
      steps++
    }
    expect(steps).toBe(HISTORY_LIMIT)
    expect(h.present).toBe(10)
  })
})
