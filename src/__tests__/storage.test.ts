import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadFrameworks, saveFrameworks } from '../storage'
import type { Framework } from '../types'

beforeEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe('loadFrameworks', () => {
  it('returns an empty array when nothing is stored', () => {
    expect(loadFrameworks()).toEqual([])
  })

  it('returns parsed frameworks from localStorage', () => {
    const stored: Framework[] = [
      {
        id: 'test-1',
        name: 'Test',
        axisX: '',
        axisY: '',
        quadrants: [
          { label: 'A', color: '#ff0000', items: [] },
          { label: 'B', color: '#00ff00', items: [] },
          { label: 'C', color: '#0000ff', items: [] },
          { label: 'D', color: '#ffff00', items: [] },
        ],
        createdAt: 1000,
        updatedAt: 1000,
      },
    ]
    localStorage.setItem('quadrants_frameworks', JSON.stringify(stored))
    expect(loadFrameworks()).toEqual(stored)
  })

  it('returns empty array on invalid JSON', () => {
    localStorage.setItem('quadrants_frameworks', 'not-json')
    expect(loadFrameworks()).toEqual([])
  })

  it('returns empty array when stored JSON is a non-array value', () => {
    localStorage.setItem('quadrants_frameworks', JSON.stringify('hello'))
    expect(loadFrameworks()).toEqual([])
  })

  it('filters out entries that do not match the Framework shape', () => {
    localStorage.setItem('quadrants_frameworks', JSON.stringify([{ id: 1 }]))
    expect(loadFrameworks()).toEqual([])
  })

  it('filters out frameworks with malformed quadrant internals', () => {
    // Previously passed the shallow check and crashed Sidebar at render.
    localStorage.setItem('quadrants_frameworks', JSON.stringify([{ id: 'x', name: 'Broken', quadrants: [1, 2, 3, 4] }]))
    expect(loadFrameworks()).toEqual([])
  })

  it('keeps valid frameworks and discards invalid ones from a mixed list', () => {
    const valid: Framework = {
      id: 'valid-1',
      name: 'Valid',
      axisX: '',
      axisY: '',
      quadrants: [
        { label: 'A', color: '#ff0000', items: [] },
        { label: 'B', color: '#00ff00', items: [] },
        { label: 'C', color: '#0000ff', items: [] },
        { label: 'D', color: '#ffff00', items: [] },
      ],
      createdAt: 1000,
      updatedAt: 1000,
    }
    const invalid = { id: 2, name: 'bad', quadrants: 'nope' }
    localStorage.setItem('quadrants_frameworks', JSON.stringify([valid, invalid]))
    expect(loadFrameworks()).toEqual([valid])
  })
})

describe('saveFrameworks', () => {
  it('persists frameworks to localStorage', () => {
    const frameworks: Framework[] = [
      {
        id: 'test-1',
        name: 'Saved',
        axisX: '',
        axisY: '',
        quadrants: [
          { label: 'A', color: '#ff0000', items: [] },
          { label: 'B', color: '#00ff00', items: [] },
          { label: 'C', color: '#0000ff', items: [] },
          { label: 'D', color: '#ffff00', items: [] },
        ],
        createdAt: 1000,
        updatedAt: 1000,
      },
    ]
    expect(saveFrameworks(frameworks)).toBe(true)
    expect(JSON.parse(localStorage.getItem('quadrants_frameworks')!)).toEqual(frameworks)
  })

  it('returns false and does not throw when localStorage throws QuotaExceededError', () => {
    const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError')
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw quotaError
    })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const frameworks: Framework[] = [
      {
        id: 'test-1',
        name: 'Big',
        axisX: '',
        axisY: '',
        quadrants: [
          { label: 'A', color: '#ff0000', items: [] },
          { label: 'B', color: '#00ff00', items: [] },
          { label: 'C', color: '#0000ff', items: [] },
          { label: 'D', color: '#ffff00', items: [] },
        ],
        createdAt: 1000,
        updatedAt: 1000,
      },
    ]

    expect(() => saveFrameworks(frameworks)).not.toThrow()
    expect(saveFrameworks(frameworks)).toBe(false)
    expect(errorSpy).toHaveBeenCalled()
  })
})
