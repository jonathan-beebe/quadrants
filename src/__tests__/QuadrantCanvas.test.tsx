import { describe, it, expect, vi, beforeEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import QuadrantCanvas from '../components/QuadrantCanvas'
import { useIsMobile } from '../hooks/useIsMobile'
import type { Framework } from '../types'

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

function makeFramework(overrides: Partial<Framework> = {}): Framework {
  return {
    id: 'fw-1',
    name: 'Test Framework',
    axisX: 'Urgency',
    axisY: 'Importance',
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
  sidebarOpen: true,
  onToggleSidebar: vi.fn(),
  onUpdate: vi.fn(),
  onEdit: vi.fn(),
  onShare: vi.fn(),
}

describe('QuadrantCanvas', () => {
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false)
  })

  it('displays the framework name', () => {
    render(<QuadrantCanvas {...defaultProps} />)
    expect(screen.getByText('Test Framework')).toBeInTheDocument()
  })

  it('renders all four quadrant labels', () => {
    render(<QuadrantCanvas {...defaultProps} />)
    expect(screen.getByText('Do First')).toBeInTheDocument()
    expect(screen.getByText('Schedule')).toBeInTheDocument()
    expect(screen.getByText('Delegate')).toBeInTheDocument()
    expect(screen.getByText('Eliminate')).toBeInTheDocument()
  })

  it('displays axis labels when present', () => {
    render(<QuadrantCanvas {...defaultProps} />)
    expect(screen.getByText('Urgency')).toBeInTheDocument()
    expect(screen.getByText('Importance')).toBeInTheDocument()
  })

  it('hides axis labels when not set', () => {
    const fw = makeFramework({ axisX: '', axisY: '' })
    render(<QuadrantCanvas {...defaultProps} framework={fw} />)
    expect(screen.queryByText('Urgency')).not.toBeInTheDocument()
    expect(screen.queryByText('Importance')).not.toBeInTheDocument()
  })

  it('renders existing items in their quadrants', () => {
    render(<QuadrantCanvas {...defaultProps} />)
    expect(screen.getByText('Task A')).toBeInTheDocument()
  })

  it('shows item counts per quadrant', () => {
    render(<QuadrantCanvas {...defaultProps} />)
    // The "Do First" quadrant has 1 item, others have 0
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('calls onEdit when Edit button is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<QuadrantCanvas {...defaultProps} onEdit={onEdit} />)
    await user.click(screen.getByText('Edit'))
    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('calls onShare when Share button is clicked', async () => {
    const user = userEvent.setup()
    const onShare = vi.fn().mockResolvedValue({ url: 'http://example.com', outcome: 'copied' })
    render(<QuadrantCanvas {...defaultProps} onShare={onShare} />)
    await user.click(screen.getByText('Share'))
    expect(onShare).toHaveBeenCalledWith(defaultProps.framework)
  })

  // BUG-002: the "Link copied!" confirmation must only render when the
  // clipboard actually received the URL — outcome=copied. For 'shared'
  // (native share UI) and 'cancelled', no toast is shown.
  it('shows "Link copied!" only when share outcome is copied (BUG-002)', async () => {
    const user = userEvent.setup()
    const onShare = vi.fn().mockResolvedValue({ url: 'http://example.com', outcome: 'shared' })
    render(<QuadrantCanvas {...defaultProps} onShare={onShare} />)
    await user.click(screen.getByText('Share'))
    expect(screen.queryByText('Link copied!')).not.toBeInTheDocument()
  })

  it('shows "Share failed" when nothing could deliver the link (BUG-002)', async () => {
    const user = userEvent.setup()
    const onShare = vi.fn().mockResolvedValue({ url: 'http://example.com', outcome: 'failed' })
    render(<QuadrantCanvas {...defaultProps} onShare={onShare} />)
    await user.click(screen.getByText('Share'))
    await waitFor(() => expect(screen.getByText('Share failed')).toBeInTheDocument())
  })

  it('calls onUpdate when add item button is clicked', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(<QuadrantCanvas {...defaultProps} onUpdate={onUpdate} />)

    // Each quadrant has an "Add item" button with aria-label
    const addButtons = screen.getAllByRole('button', { name: /Add item to/ })
    expect(addButtons).toHaveLength(4)

    await user.click(addButtons[0])
    expect(onUpdate).toHaveBeenCalledOnce()
    // The updated framework should have one more item in the first quadrant
    const updatedFw = onUpdate.mock.calls[0][0]
    expect(updatedFw.quadrants[0].items).toHaveLength(2)
  })

  it('removes the placeholder card when Escape cancels a fresh add (BUG-004)', async () => {
    // Stateful wrapper so the canvas reflects its own updates, as in App.
    function Wrapper() {
      const [fw, setFw] = useState(makeFramework())
      return <QuadrantCanvas {...defaultProps} framework={fw} onUpdate={setFw} />
    }
    const user = userEvent.setup()
    render(<Wrapper />)

    const addButtons = screen.getAllByRole('button', { name: /Add item to/ })
    await user.click(addButtons[0])

    // The fresh item mounts in edit mode.
    const textarea = await screen.findByRole('textbox')
    act(() => {
      fireEvent.keyDown(textarea, { key: 'Escape' })
      fireEvent.blur(textarea)
    })

    // No "New item..." card survives the cancelled add.
    expect(screen.queryByText('New item...')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    // The pre-existing item is untouched.
    expect(screen.getByText('Task A')).toBeInTheDocument()
  })

  it('does not re-open edit mode when the grid remounts after a committed add (BUG-009)', async () => {
    function Wrapper() {
      const [fw, setFw] = useState(makeFramework())
      return <QuadrantCanvas {...defaultProps} framework={fw} onUpdate={setFw} />
    }
    const user = userEvent.setup()
    const { rerender } = render(<Wrapper />)

    // Add an item and commit its text.
    await user.click(screen.getAllByRole('button', { name: /Add item to/ })[0])
    const textarea = await screen.findByRole('textbox')
    fireEvent.change(textarea, { target: { value: 'Committed text' } })
    act(() => {
      fireEvent.blur(textarea)
    })
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

    // Cross the 768px breakpoint: the grid component swaps and every Card
    // remounts. The consumed autoFocusId must not re-trigger edit mode.
    vi.mocked(useIsMobile).mockReturnValue(true)
    rerender(<Wrapper />)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText('Committed text')).toBeInTheDocument()
  })

  // MAINT-001: end-to-end coverage for the pointer drag-and-drop drop resolution
  // wiring (Card pointer events → useDragAndDrop → handleDrop → moveItem → onUpdate).
  // jsdom doesn't compute layout, so each test stubs getBoundingClientRect on the
  // four quadrant sections, their canvas children, and the card outer element.
  describe('drag-and-drop drop resolution (MAINT-001)', () => {
    function stubRect(el: Element, rect: Partial<DOMRect>) {
      ;(el as HTMLElement).getBoundingClientRect = () =>
        ({
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
          toJSON: () => '',
          ...rect,
        }) as DOMRect
    }

    // 2x2 grid, each cell 200x200 in viewport coords.
    const QUADRANT_LAYOUT = [
      { left: 0, top: 0 },
      { left: 200, top: 0 },
      { left: 0, top: 200 },
      { left: 200, top: 200 },
    ]

    function stubLayout(container: HTMLElement) {
      const sections = Array.from(container.querySelectorAll('section'))
      expect(sections).toHaveLength(4)
      sections.forEach((section, i) => {
        const { left, top } = QUADRANT_LAYOUT[i]
        const rect = { left, top, right: left + 200, bottom: top + 200, width: 200, height: 200 }
        stubRect(section, rect)
        // Canvas div is the one that hosts the items (closest absolute child of section).
        const canvas = section.querySelector('div[class*="flex-1"]')
        if (canvas) stubRect(canvas, rect)
      })
    }

    // jsdom's PointerEvent constructor ignores clientX/clientY; MouseEvent honors
    // them and React treats type='pointerdown' as a pointer event.
    function pointerEvent(type: string, clientX: number, clientY: number) {
      return new MouseEvent(type, { clientX, clientY, bubbles: true })
    }

    function findCardOuter(text: string): HTMLElement {
      const button = screen.getByRole('button', { name: new RegExp(`edit item: ${text}`, 'i') })
      // Card's outer wrapper carries inline style left/top — walk up to it.
      const outer = button.closest('div[style*="left"]')
      if (!outer) throw new Error('Could not find card outer element')
      return outer as HTMLElement
    }

    function dragAndDrop(card: HTMLElement, from: { x: number; y: number }, to: { x: number; y: number }) {
      // Start at `from`, move past the 4px threshold to trigger drag start, then
      // release at `to`.
      card.dispatchEvent(pointerEvent('pointerdown', from.x, from.y))
      act(() => {
        window.dispatchEvent(pointerEvent('pointermove', from.x + 20, from.y + 20))
      })
      act(() => {
        window.dispatchEvent(pointerEvent('pointerup', to.x, to.y))
      })
    }

    it('moving Task A into quadrant 1 updates the framework with item in target', () => {
      const onUpdate = vi.fn()
      const { container } = render(<QuadrantCanvas {...defaultProps} onUpdate={onUpdate} />)
      stubLayout(container)
      const card = findCardOuter('Task A')
      stubRect(card, { left: 20, top: 20, right: 100, bottom: 50, width: 80, height: 30 })

      // Pointer up at (250, 80) — inside quadrant 1 (top-right cell).
      dragAndDrop(card, { x: 30, y: 30 }, { x: 250, y: 80 })

      expect(onUpdate).toHaveBeenCalled()
      const updated = onUpdate.mock.calls.at(-1)![0] as Framework
      expect(updated.quadrants[0].items).toHaveLength(0)
      expect(updated.quadrants[1].items).toHaveLength(1)
      expect(updated.quadrants[1].items[0].text).toBe('Task A')
      // Coordinates are clamped to 2..85.
      expect(updated.quadrants[1].items[0].x).toBeGreaterThanOrEqual(2)
      expect(updated.quadrants[1].items[0].x).toBeLessThanOrEqual(85)
      expect(updated.quadrants[1].items[0].y).toBeGreaterThanOrEqual(2)
      expect(updated.quadrants[1].items[0].y).toBeLessThanOrEqual(85)
    })

    it('dropping within the source quadrant repositions the item in place', () => {
      const onUpdate = vi.fn()
      const { container } = render(<QuadrantCanvas {...defaultProps} onUpdate={onUpdate} />)
      stubLayout(container)
      const card = findCardOuter('Task A')
      stubRect(card, { left: 20, top: 20, right: 100, bottom: 50, width: 80, height: 30 })

      // Release at (120, 120) — still inside quadrant 0 (top-left, 0..200 x 0..200).
      dragAndDrop(card, { x: 30, y: 30 }, { x: 120, y: 120 })

      expect(onUpdate).toHaveBeenCalled()
      const updated = onUpdate.mock.calls.at(-1)![0] as Framework
      // Same-quadrant drop: item stays in quadrant 0 with new coordinates.
      expect(updated.quadrants[0].items).toHaveLength(1)
      expect(updated.quadrants[1].items).toHaveLength(0)
      expect(updated.quadrants[2].items).toHaveLength(0)
      expect(updated.quadrants[3].items).toHaveLength(0)
      expect(updated.quadrants[0].items[0].id).toBe('i1')
    })

    it('dropping outside all quadrant rects leaves the framework unchanged', () => {
      const onUpdate = vi.fn()
      const { container } = render(<QuadrantCanvas {...defaultProps} onUpdate={onUpdate} />)
      stubLayout(container)
      const card = findCardOuter('Task A')
      stubRect(card, { left: 20, top: 20, right: 100, bottom: 50, width: 80, height: 30 })

      // Release at (1000, 1000) — far outside the 400x400 grid.
      dragAndDrop(card, { x: 30, y: 30 }, { x: 1000, y: 1000 })

      expect(onUpdate).not.toHaveBeenCalled()
    })
  })

  it('clears the share status timer on unmount (BUG-012)', async () => {
    // Track timeouts scheduled with a 2000ms delay (the share-status reset)
    // so we can assert the component clears them on unmount.
    const realSetTimeout = globalThis.setTimeout
    const realClearTimeout = globalThis.clearTimeout
    const shareTimerIds = new Set<ReturnType<typeof setTimeout>>()
    const clearedTimerIds = new Set<ReturnType<typeof setTimeout>>()

    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout').mockImplementation(((
      handler: TimerHandler,
      timeout?: number,
      ...args: unknown[]
    ) => {
      const id = realSetTimeout(handler as () => void, timeout, ...args)
      if (timeout === 2000) shareTimerIds.add(id)
      return id
    }) as typeof setTimeout)

    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout').mockImplementation(((
      id?: ReturnType<typeof setTimeout>,
    ) => {
      if (id !== undefined) clearedTimerIds.add(id)
      realClearTimeout(id)
    }) as typeof clearTimeout)

    try {
      const user = userEvent.setup()
      const onShare = vi.fn().mockResolvedValue({ url: 'http://example.com', outcome: 'copied' })
      const { unmount } = render(<QuadrantCanvas {...defaultProps} onShare={onShare} />)

      await user.click(screen.getByText('Share'))

      // After the share resolves, the component should have scheduled the
      // 2s reset timer.
      await waitFor(() => {
        expect(shareTimerIds.size).toBeGreaterThan(0)
      })

      // Unmount before the timer fires.
      act(() => {
        unmount()
      })

      // Every share-status timer scheduled by the component must be cleared
      // on unmount.
      for (const id of shareTimerIds) {
        expect(clearedTimerIds.has(id)).toBe(true)
      }
    } finally {
      setTimeoutSpy.mockRestore()
      clearTimeoutSpy.mockRestore()
    }
  })

  it('announces item text when deleting an item', async () => {
    const user = userEvent.setup()
    render(<QuadrantCanvas {...defaultProps} />)

    // Delete the existing item "Task A" via its delete button
    const deleteBtn = screen.getByRole('button', { name: /delete item: task a/i })
    await user.click(deleteBtn)

    // The sr-only aria-live region should announce the deletion with the item name
    await waitFor(() => {
      const liveRegions = screen.getAllByRole('status')
      const announcement = liveRegions.find((el) => el.textContent?.includes('deleted from'))
      expect(announcement).toBeDefined()
      expect(announcement!.textContent).toContain('Task A')
    })
  })
})
