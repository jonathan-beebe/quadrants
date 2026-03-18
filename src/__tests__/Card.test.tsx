import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Card, { GhostCard } from '../components/Card'
import type { Item } from '../types'

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 'item-1',
    text: 'Test card',
    x: 25,
    y: 30,
    createdAt: 1000,
    ...overrides,
  }
}

const defaultProps = {
  item: makeItem(),
  isDragging: false,
  autoFocus: false,
  onChange: vi.fn(),
  onDelete: vi.fn(),
  onDragStart: vi.fn(),
}

describe('Card', () => {
  it('renders the item text', () => {
    render(<Card {...defaultProps} />)
    expect(screen.getByText('Test card')).toBeInTheDocument()
  })

  it('positions the card based on item coordinates', () => {
    const { container } = render(<Card {...defaultProps} />)
    const card = container.firstElementChild as HTMLElement
    expect(card.style.left).toBe('25%')
    expect(card.style.top).toBe('30%')
  })

  it('shows a delete button', () => {
    render(<Card {...defaultProps} />)
    expect(screen.getByTitle('Delete')).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<Card {...defaultProps} onDelete={onDelete} />)
    await user.click(screen.getByTitle('Delete'))
    expect(onDelete).toHaveBeenCalledOnce()
  })

  it('applies dragging styles when isDragging is true', () => {
    const { container } = render(<Card {...defaultProps} isDragging={true} />)
    const card = container.firstElementChild as HTMLElement
    expect(card.className).toContain('opacity-30')
    expect(card.className).toContain('pointer-events-none')
  })

  it('does not apply dragging styles when isDragging is false', () => {
    const { container } = render(<Card {...defaultProps} isDragging={false} />)
    const card = container.firstElementChild as HTMLElement
    expect(card.className).not.toContain('opacity-30')
  })
})

describe('GhostCard', () => {
  it('renders the text content', () => {
    const drag = { x: 100, y: 200, grabX: 10, grabY: 10, width: 150, height: 40 }
    render(<GhostCard drag={drag} text="Dragging item" />)
    expect(screen.getByText('Dragging item')).toBeInTheDocument()
  })

  it('positions itself based on drag state', () => {
    const drag = { x: 100, y: 200, grabX: 10, grabY: 10, width: 150, height: 40 }
    const { container } = render(<GhostCard drag={drag} text="Test" />)
    const ghost = container.firstElementChild as HTMLElement
    expect(ghost.style.left).toBe('90px') // x - grabX
    expect(ghost.style.top).toBe('190px') // y - grabY
    expect(ghost.style.position).toBe('fixed')
  })
})
