import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import CanvasPreview from '../components/CanvasPreview'
import type { Framework } from '../types'

function makeFramework(overrides: Partial<Framework> = {}): Framework {
  return {
    id: 'fw-1',
    name: 'Test Framework',
    axisX: '',
    axisY: '',
    quadrants: [
      { label: 'Q1', color: '#fbbf24', items: [{ id: 'i1', text: 'Item', x: 10, y: 10, createdAt: 1000 }] },
      { label: 'Q2', color: '#60a5fa', items: [] },
      { label: 'Q3', color: '#34d399', items: [] },
      { label: 'Q4', color: '#f472b6', items: [] },
    ],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

describe('CanvasPreview', () => {
  it('renders a square bitmap at preview resolution', () => {
    const { container } = render(<CanvasPreview framework={makeFramework()} />)
    const canvas = container.querySelector('canvas')
    expect(canvas).toHaveAttribute('width', '128')
    expect(canvas).toHaveAttribute('height', '128')
  })

  it('is decorative: the framework name and count already carry the meaning', () => {
    const { container } = render(<CanvasPreview framework={makeFramework()} />)
    expect(container.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders without a 2D context rather than throwing', () => {
    // jsdom has no canvas context (test-setup.ts stubs getContext to null), and
    // neither does a browser that refuses one under memory pressure.
    const empty = makeFramework({
      quadrants: makeFramework().quadrants.map((q) => ({ ...q, items: [] })),
    })
    expect(() => render(<CanvasPreview framework={empty} />)).not.toThrow()
  })
})
