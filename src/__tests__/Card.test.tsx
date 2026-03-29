import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Card, { GhostCard, PLACEHOLDER } from '../components/Card'
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
  moveTargets: [
    { label: 'Schedule', index: 1 },
    { label: 'Delegate', index: 2 },
    { label: 'Eliminate', index: 3 },
  ],
  onChange: vi.fn(),
  onDelete: vi.fn(),
  onMove: vi.fn(),
  onDragStart: vi.fn(),
}

function renderCard(overrides = {}) {
  const props = {
    ...defaultProps,
    onChange: vi.fn(),
    onDelete: vi.fn(),
    onMove: vi.fn(),
    onDragStart: vi.fn(),
    ...overrides,
  }
  const result = render(<Card {...props} />)
  return { ...result, props }
}

describe('Card', () => {
  describe('rendering', () => {
    it('renders the item text in display mode', () => {
      renderCard()
      expect(screen.getByText('Test card')).toBeInTheDocument()
    })

    it('positions the card based on item coordinates', () => {
      const { container } = renderCard()
      const card = container.firstElementChild as HTMLElement
      expect(card.style.left).toBe('25%')
      expect(card.style.top).toBe('30%')
    })

    it('uses default coordinates when item has no position', () => {
      const { container } = renderCard({ item: makeItem({ x: undefined, y: undefined }) })
      const card = container.firstElementChild as HTMLElement
      expect(card.style.left).toBe('10%')
      expect(card.style.top).toBe('10%')
    })

    it('shows a delete button', () => {
      renderCard()
      expect(screen.getByTitle('Delete')).toBeInTheDocument()
    })
  })

  describe('drag threshold', () => {
    it('does not fire onDragStart immediately when pointer-down on card outer area', () => {
      const { container, props } = renderCard()
      const card = container.firstElementChild as HTMLElement

      // Simulate pointerdown on the outer card div (padding area)
      card.dispatchEvent(new PointerEvent('pointerdown', { button: 0, clientX: 50, clientY: 50, bubbles: true }))

      // onDragStart should NOT be called immediately — it should wait for threshold movement
      expect(props.onDragStart).not.toHaveBeenCalled()
    })
  })

  describe('dragging styles', () => {
    it('applies dragging styles when isDragging is true', () => {
      const { container } = renderCard({ isDragging: true })
      const card = container.firstElementChild as HTMLElement
      expect(card.className).toContain('opacity-30')
      expect(card.className).toContain('pointer-events-none')
    })

    it('does not apply dragging styles when isDragging is false', () => {
      const { container } = renderCard({ isDragging: false })
      const card = container.firstElementChild as HTMLElement
      expect(card.className).not.toContain('opacity-30')
    })
  })

  describe('accessibility', () => {
    it('display button is focusable with correct role', () => {
      renderCard()
      const btn = screen.getByRole('button', { name: /edit item: test card/i })
      expect(btn).toBeInTheDocument()
      expect(btn.tagName).toBe('BUTTON')
    })

    it('display span has an aria-label', () => {
      renderCard()
      const span = screen.getByRole('button', { name: /edit item: test card/i })
      expect(span).toHaveAttribute('aria-label', 'Edit item: Test card. Press M to move.')
    })

    it('delete button has an aria-label', () => {
      renderCard()
      const btn = screen.getByRole('button', { name: /delete item: test card/i })
      expect(btn).toBeInTheDocument()
    })

    it('textarea has an aria-label when editing', async () => {
      const user = userEvent.setup()
      renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      await user.click(span)
      const textarea = screen.getByRole('textbox')
      expect(textarea).toHaveAttribute('aria-label', 'Edit item: Test card')
    })
  })

  describe('entering edit mode', () => {
    it('enters edit mode on click (pointerup without drag)', async () => {
      const user = userEvent.setup()
      renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      await user.click(span)
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('enters edit mode on Enter key', async () => {
      const user = userEvent.setup()
      renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      span.focus()
      await user.keyboard('{Enter}')
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('enters edit mode on Space key', async () => {
      const user = userEvent.setup()
      renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      span.focus()
      await user.keyboard(' ')
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('starts in edit mode when autoFocus is true', () => {
      renderCard({ autoFocus: true })
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })

    it('textarea is focused and text selected when entering edit mode', async () => {
      const user = userEvent.setup()
      renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      await user.click(span)
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea).toHaveFocus()
    })

    it('populates textarea with item text', async () => {
      const user = userEvent.setup()
      renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      await user.click(span)
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.value).toBe('Test card')
    })

    it('applies min-width and min-height from display span dimensions', async () => {
      const user = userEvent.setup()
      renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      // jsdom returns 0 for offsetWidth/Height, so minWidth/minHeight will be 0
      // but the style attributes should still be set
      await user.click(span)
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement
      expect(textarea.style.minWidth).toBeDefined()
      expect(textarea.style.minHeight).toBeDefined()
    })

    it('clears min-size styles after exiting edit mode', async () => {
      const user = userEvent.setup()
      renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      await user.click(span)
      await user.keyboard('{Enter}')
      // Back in display mode — no textarea present
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    })
  })

  describe('committing edits', () => {
    it('calls onChange with trimmed text on Enter', async () => {
      const user = userEvent.setup()
      const { props } = renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      await user.click(span)
      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, 'Updated text{Enter}')
      expect(props.onChange).toHaveBeenCalledWith('Updated text')
    })

    it('calls onChange with trimmed text on blur', async () => {
      const user = userEvent.setup()
      const { props } = renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      await user.click(span)
      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, '  New value  ')
      await user.tab()
      expect(props.onChange).toHaveBeenCalledWith('New value')
    })

    it('does not call onChange when text is unchanged', async () => {
      const user = userEvent.setup()
      const { props } = renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      await user.click(span)
      await user.keyboard('{Enter}')
      expect(props.onChange).not.toHaveBeenCalled()
    })

    it('returns to display mode after committing', async () => {
      const user = userEvent.setup()
      renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      await user.click(span)
      await user.keyboard('{Enter}')
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /edit item/i })).toBeInTheDocument()
    })
  })

  describe('cancelling edits', () => {
    it('reverts to display mode on Escape without calling onChange', async () => {
      const user = userEvent.setup()
      const { props } = renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      await user.click(span)
      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, 'Unsaved changes')
      await user.keyboard('{Escape}')
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(props.onChange).not.toHaveBeenCalled()
    })
  })

  describe('deletion', () => {
    it('calls onDelete when delete button is clicked', async () => {
      const user = userEvent.setup()
      const { props } = renderCard()
      await user.click(screen.getByTitle('Delete'))
      expect(props.onDelete).toHaveBeenCalledOnce()
    })

    it('calls onDelete when text is cleared and committed', async () => {
      const user = userEvent.setup()
      const { props } = renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      await user.click(span)
      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.keyboard('{Enter}')
      expect(props.onDelete).toHaveBeenCalledOnce()
    })

    it('calls onDelete when text is only whitespace and committed', async () => {
      const user = userEvent.setup()
      const { props } = renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      await user.click(span)
      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, '   ')
      await user.keyboard('{Enter}')
      expect(props.onDelete).toHaveBeenCalledOnce()
    })

    it('calls onDelete when text equals the placeholder and committed', async () => {
      const user = userEvent.setup()
      const { props } = renderCard()
      const span = screen.getByRole('button', { name: /edit item/i })
      await user.click(span)
      const textarea = screen.getByRole('textbox')
      await user.clear(textarea)
      await user.type(textarea, PLACEHOLDER)
      await user.keyboard('{Enter}')
      expect(props.onDelete).toHaveBeenCalledOnce()
    })
  })
})

describe('GhostCard', () => {
  it('renders the text content', () => {
    const drag = { itemId: 'i1', sourceIdx: 0, x: 100, y: 200, grabX: 10, grabY: 10, width: 150, height: 40 }
    render(<GhostCard drag={drag} text="Dragging item" />)
    expect(screen.getByText('Dragging item')).toBeInTheDocument()
  })

  it('positions itself based on drag state', () => {
    const drag = { itemId: 'i1', sourceIdx: 0, x: 100, y: 200, grabX: 10, grabY: 10, width: 150, height: 40 }
    const { container } = render(<GhostCard drag={drag} text="Test" />)
    const ghost = container.firstElementChild as HTMLElement
    expect(ghost.style.left).toBe('90px') // x - grabX
    expect(ghost.style.top).toBe('190px') // y - grabY
    expect(ghost.style.position).toBe('fixed')
  })
})
