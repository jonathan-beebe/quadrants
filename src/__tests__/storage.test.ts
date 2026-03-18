import { describe, it, expect, beforeEach, vi } from 'vitest'
import { loadFrameworks, saveFrameworks, createFramework, createItem } from '../storage'
import type { Framework, FrameworkTemplate } from '../types'

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
    saveFrameworks(frameworks)
    expect(JSON.parse(localStorage.getItem('quadrants_frameworks')!)).toEqual(frameworks)
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
