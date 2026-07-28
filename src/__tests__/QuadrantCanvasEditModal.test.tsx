import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import QuadrantCanvas from '../components/QuadrantCanvas'
import { useIsMobile } from '../hooks/useIsMobile'
import { useExpectsOnScreenKeyboard } from '../hooks/useExpectsOnScreenKeyboard'
import type { Framework } from '../types'

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

vi.mock('../hooks/useExpectsOnScreenKeyboard', () => ({
  useExpectsOnScreenKeyboard: vi.fn(() => false),
}))

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

/** Stateful host so saves re-render the canvas the way App would. */
function Harness({ initial }: { initial: Framework }) {
  const [framework, setFramework] = useState(initial)
  return (
    <QuadrantCanvas
      framework={framework}
      sidebarOpen={false}
      onToggleSidebar={() => {}}
      onUpdate={setFramework}
      onEdit={() => {}}
      onShare={() => Promise.resolve({ outcome: 'copied' as const, url: 'https://example.test/share' })}
    />
  )
}

const card = () => screen.getByRole('button', { name: /edit item: task a/i })
const modal = () => within(screen.getByRole('dialog'))

/** Zoom the mobile grid into a quadrant (top-left = 0). */
function zoomInto(clientX: number, clientY: number) {
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
  fireEvent.click(grid, { clientX, clientY })
}

describe('QuadrantCanvas — item editing routed through EditModal (IMPRV-006)', () => {
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false)
    vi.mocked(useExpectsOnScreenKeyboard).mockReturnValue(true)
  })

  it('opens the modal on card tap even on the desktop grid — routing follows the keyboard verdict, not the layout', async () => {
    const user = userEvent.setup()
    render(<Harness initial={makeFramework()} />)

    await user.click(card())

    const dialog = screen.getByRole('dialog', { name: 'Edit item' })
    expect(dialog).toBeInTheDocument()
    // The item's text is in the modal field, focused — not in an inline textarea.
    const field = within(dialog).getByRole('textbox')
    expect(field).toHaveValue('Task A')
    expect(field).toHaveFocus()
  })

  it('advertises the dialog on the card trigger', () => {
    render(<Harness initial={makeFramework()} />)
    expect(card()).toHaveAttribute('aria-haspopup', 'dialog')
  })

  it('saves modal edits back onto the item and returns focus to the card (A11Y-022)', async () => {
    const user = userEvent.setup()
    render(<Harness initial={makeFramework()} />)

    await user.click(card())
    await user.clear(modal().getByRole('textbox'))
    await user.type(modal().getByRole('textbox'), 'Task A revised')
    await user.click(modal().getByRole('button', { name: 'Save' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    const revised = screen.getByRole('button', { name: /edit item: task a revised/i })
    expect(revised).toBeInTheDocument()
    expect(revised).toHaveFocus()
  })

  it('discards modal edits on cancel', async () => {
    const user = userEvent.setup()
    render(<Harness initial={makeFramework()} />)

    await user.click(card())
    await user.type(modal().getByRole('textbox'), ' edited')
    await user.click(modal().getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByText('Task A')).toBeInTheDocument()
  })

  it('deletes the item from the modal', async () => {
    const user = userEvent.setup()
    render(<Harness initial={makeFramework()} />)

    await user.click(card())
    await user.click(modal().getByRole('button', { name: 'Delete' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Task A')).not.toBeInTheDocument()
  })

  it('deletes the item when a save empties its text, mirroring inline commit', async () => {
    const user = userEvent.setup()
    render(<Harness initial={makeFramework()} />)

    await user.click(card())
    await user.clear(modal().getByRole('textbox'))
    await user.click(modal().getByRole('button', { name: 'Save' }))

    expect(screen.queryByText('Task A')).not.toBeInTheDocument()
  })

  it('adds through the modal: nothing persists until Save', async () => {
    const user = userEvent.setup()
    render(<Harness initial={makeFramework()} />)

    await user.click(screen.getByRole('button', { name: /add item to schedule/i }))

    const dialog = screen.getByRole('dialog', { name: 'Add item' })
    expect(dialog).toBeInTheDocument()
    // No placeholder card was persisted to open the modal.
    expect(screen.queryByText('New item...')).not.toBeInTheDocument()

    await user.type(within(dialog).getByRole('textbox'), 'Prep roadmap')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    expect(screen.getByText('Prep roadmap')).toBeInTheDocument()
  })

  it('cancelling an add leaves no card behind', async () => {
    const user = userEvent.setup()
    render(<Harness initial={makeFramework()} />)

    await user.click(screen.getByRole('button', { name: /add item to schedule/i }))
    await user.type(modal().getByRole('textbox'), 'Changed my mind')
    await user.click(modal().getByRole('button', { name: 'Cancel' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByText('Changed my mind')).not.toBeInTheDocument()
    expect(screen.queryByText('New item...')).not.toBeInTheDocument()
  })

  it('routes tap and add through the modal on the mobile grid too', async () => {
    vi.mocked(useIsMobile).mockReturnValue(true)
    const user = userEvent.setup()
    render(<Harness initial={makeFramework()} />)

    zoomInto(50, 50) // Do First
    await user.click(card())
    expect(screen.getByRole('dialog', { name: 'Edit item' })).toBeInTheDocument()
    await user.click(modal().getByRole('button', { name: 'Cancel' }))

    await user.click(screen.getByRole('button', { name: /add item to do first/i }))
    expect(screen.getByRole('dialog', { name: 'Add item' })).toBeInTheDocument()
    expect(screen.queryByText('New item...')).not.toBeInTheDocument()
  })

  it('leaves inline editing untouched where no on-screen keyboard is expected', async () => {
    vi.mocked(useExpectsOnScreenKeyboard).mockReturnValue(false)
    const user = userEvent.setup()
    render(<Harness initial={makeFramework()} />)

    // The move menu's popup semantics (A11Y-015) survive; only the dialog
    // claim is withheld on the inline path.
    expect(card()).not.toHaveAttribute('aria-haspopup', 'dialog')
    await user.click(card())

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    // The inline textarea is the edit surface, exactly as before.
    expect(screen.getByRole('textbox', { name: /edit item: task a/i })).toBeInTheDocument()
  })
})
