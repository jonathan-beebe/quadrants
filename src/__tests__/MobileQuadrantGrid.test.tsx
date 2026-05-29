import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import MobileQuadrantGrid from '../components/MobileQuadrantGrid'
import type { Framework } from '../types'

function makeFramework(overrides: Partial<Framework> = {}): Framework {
  return {
    id: 'fw-1',
    name: 'Test Framework',
    axisX: '',
    axisY: '',
    quadrants: [
      { label: 'Do First', color: '#fbbf24', items: [{ id: 'i1', text: 'Task A', x: 10, y: 10, createdAt: 1000 }] },
      { label: 'Schedule', color: '#60a5fa', items: [] },
      { label: 'Delegate', color: '#34d399', items: [] },
      { label: 'Eliminate', color: '#f472b6', items: [] },
    ],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

const defaultProps = {
  framework: makeFramework(),
  drag: null,
  autoFocusId: null,
  quadrantRefs: createRef<(HTMLElement | null)[]>() as React.RefObject<(HTMLElement | null)[]>,
  canvasRefs: createRef<(HTMLElement | null)[]>() as React.RefObject<(HTMLElement | null)[]>,
  onAddItem: vi.fn(),
  onDeleteItem: vi.fn(),
  onEditItem: vi.fn(),
  onColorChange: vi.fn(),
  onMoveItem: vi.fn(),
  onReposition: vi.fn(),
  onDragStart: vi.fn(),
}

// Initialize refs before each render
function renderGrid(overrides = {}) {
  const props = { ...defaultProps, ...overrides }
  ;(props.quadrantRefs as { current: unknown }).current = [null, null, null, null]
  ;(props.canvasRefs as { current: unknown }).current = [null, null, null, null]
  return render(<MobileQuadrantGrid {...props} />)
}

describe('MobileQuadrantGrid', () => {
  it('renders all four quadrant labels in overview', () => {
    renderGrid()
    expect(screen.getByText('Do First')).toBeInTheDocument()
    expect(screen.getByText('Schedule')).toBeInTheDocument()
    expect(screen.getByText('Delegate')).toBeInTheDocument()
    expect(screen.getByText('Eliminate')).toBeInTheDocument()
  })

  it('renders quadrant sections with aria labels', () => {
    renderGrid()
    for (const label of ['Do First', 'Schedule', 'Delegate', 'Eliminate']) {
      // In overview mode, sections expose role="button" so keyboard users can zoom.
      expect(screen.getByRole('button', { name: new RegExp(`^${label} - tap to edit$`, 'i') })).toBeInTheDocument()
    }
  })

  it('does not show Done button or Add button in overview mode', () => {
    renderGrid()
    expect(screen.queryByText('Done')).not.toBeInTheDocument()
    expect(screen.queryByText('Add')).not.toBeInTheDocument()
  })

  /** Click the grid at a position to zoom into a quadrant. */
  function zoomInto(grid: HTMLElement, clientX: number, clientY: number) {
    grid.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 400,
      height: 400,
      right: 400,
      bottom: 400,
      x: 0,
      y: 0,
      toJSON: () => {},
    })
    fireEvent.click(grid, { clientX, clientY })
  }

  it('shows Done button and Add button after clicking a quadrant', () => {
    renderGrid()
    const grid = screen.getByRole('group', { name: 'Quadrant grid' })
    zoomInto(grid, 50, 50)

    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add item to do first/i })).toBeInTheDocument()
  })

  it('exits zoom when Done is clicked', async () => {
    const user = userEvent.setup()
    renderGrid()
    const grid = screen.getByRole('group', { name: 'Quadrant grid' })
    zoomInto(grid, 50, 50)
    expect(screen.getByText('Done')).toBeInTheDocument()

    await user.click(screen.getByText('Done'))
    expect(screen.queryByText('Done')).not.toBeInTheDocument()
  })

  it('calls onAddItem when Add button is clicked in focused mode', async () => {
    const user = userEvent.setup()
    const onAddItem = vi.fn()
    renderGrid({ onAddItem })
    const grid = screen.getByRole('group', { name: 'Quadrant grid' })
    zoomInto(grid, 50, 50)

    await user.click(screen.getByRole('button', { name: /add item to do first/i }))
    expect(onAddItem).toHaveBeenCalledWith(0)
  })

  it('shows item count badge in focused mode', () => {
    renderGrid()
    const grid = screen.getByRole('group', { name: 'Quadrant grid' })
    zoomInto(grid, 50, 50)

    // Do First has 1 item
    expect(screen.getByText('1', { selector: '[role="status"]' })).toBeInTheDocument()
  })

  it('renders cards in the canvas', () => {
    renderGrid()
    expect(screen.getByText('Task A')).toBeInTheDocument()
  })

  it('applies overview transform when not zoomed', () => {
    renderGrid()
    const grid = screen.getByRole('group', { name: 'Quadrant grid' })
    expect(grid.style.transform).toBe('scale(0.5)')
  })

  it('exposes each overview quadrant as a focusable button with tap-to-edit label', () => {
    renderGrid()
    for (const label of ['Do First', 'Schedule', 'Delegate', 'Eliminate']) {
      const section = screen.getByRole('button', { name: new RegExp(`${label} .* tap to edit`, 'i') })
      expect(section).toHaveAttribute('tabIndex', '0')
    }
  })

  it('zooms into a quadrant when its section receives keyboard activation', async () => {
    const user = userEvent.setup()
    renderGrid()
    const section = screen.getByRole('button', { name: /schedule .* tap to edit/i })
    section.focus()
    expect(section).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add item to schedule/i })).toBeInTheDocument()
  })

  it('zooms into a quadrant when Space is pressed on its section', async () => {
    const user = userEvent.setup()
    renderGrid()
    const section = screen.getByRole('button', { name: /delegate .* tap to edit/i })
    section.focus()
    await user.keyboard(' ')
    expect(screen.getByRole('button', { name: /add item to delegate/i })).toBeInTheDocument()
  })

  it('marks every quadrant canvas as inert in overview so cards are not tab stops', () => {
    renderGrid()
    // Each card lives inside the canvas div; its closest [inert] ancestor must exist
    // in overview, otherwise tab order would include the card buttons inside a role=button.
    const card = screen.getByText('Task A')
    expect(card.closest('[inert]')).not.toBeNull()
  })

  it('only the focused quadrant canvas is interactive when zoomed', () => {
    renderGrid()
    const grid = screen.getByRole('group', { name: 'Quadrant grid' })
    zoomInto(grid, 50, 50) // zoom into Do First (quadrant 0)

    // Do First's card is now in the focused canvas — not inside an inert subtree.
    const card = screen.getByText('Task A')
    expect(card.closest('[inert]')).toBeNull()
  })

  it('applies cell transform when zoomed into bottom-right', () => {
    renderGrid()

    const grid = screen.getByRole('group', { name: 'Quadrant grid' })
    grid.getBoundingClientRect = () => ({
      left: 0,
      top: 0,
      width: 400,
      height: 400,
      right: 400,
      bottom: 400,
      x: 0,
      y: 0,
      toJSON: () => {},
    })
    // Fire click in bottom-right area (quadrant 3)
    fireEvent.click(grid, { clientX: 350, clientY: 350 })

    expect(grid.style.transform).toBe('translate(-50%, -50%)')
  })
})
