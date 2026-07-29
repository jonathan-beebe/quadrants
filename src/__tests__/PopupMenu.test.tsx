import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState, useCallback } from 'react'
import PopupMenu, { popupMenuTriggerProps } from '../components/PopupMenu'
import type { PopupMenuItem } from '../components/PopupMenu'

const MENU_ID = 'demo-menu'

function makeItems(): PopupMenuItem[] {
  return [
    { label: 'Duplicate', onSelect: vi.fn() },
    { label: 'Export JSON', onSelect: vi.fn() },
    { label: 'Delete', onSelect: vi.fn(), variant: 'danger' },
  ]
}

/**
 * A trigger that toggles the menu on click — the Sidebar shape, where
 * `triggerToggles` keeps the outside-click handler off the trigger (BUG-005).
 */
function TogglingHarness({ items }: { items: PopupMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])
  return (
    <div>
      <button ref={triggerRef} {...popupMenuTriggerProps(MENU_ID, open)} onClick={() => setOpen((o) => !o)}>
        Actions
      </button>
      <PopupMenu
        id={MENU_ID}
        open={open}
        onClose={close}
        triggerRef={triggerRef}
        triggerToggles
        label="Actions for Alpha"
        items={items}
      />
      <button>Elsewhere</button>
    </div>
  )
}

/**
 * A trigger that does not toggle on click — the Card shape, where the menu
 * opens from a keypress and a press on the trigger is an ordinary outside
 * click that must dismiss it.
 */
function KeyOpenedHarness({ items }: { items: PopupMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpen(false), [])
  return (
    <div>
      <button
        ref={triggerRef}
        {...popupMenuTriggerProps(MENU_ID, open)}
        onKeyDown={(e) => {
          if (e.key === 'm') setOpen(true)
        }}>
        Item text
      </button>
      <PopupMenu
        id={MENU_ID}
        open={open}
        onClose={close}
        triggerRef={triggerRef}
        label="Move to quadrant"
        items={items}
      />
      <button>Elsewhere</button>
    </div>
  )
}

// RFCTR-019: one surface owns popup-menu behavior and semantics for Card's
// move menu and Sidebar's actions menu.
describe('PopupMenu', () => {
  describe('rendering and semantics', () => {
    it('renders nothing until it is open', () => {
      render(<TogglingHarness items={makeItems()} />)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('renders a named menu with one menuitem per item', async () => {
      const user = userEvent.setup()
      render(<TogglingHarness items={makeItems()} />)
      await user.click(screen.getByRole('button', { name: 'Actions' }))

      expect(screen.getByRole('menu', { name: 'Actions for Alpha' })).toBeInTheDocument()
      expect(screen.getAllByRole('menuitem').map((el) => el.textContent)).toEqual([
        'Duplicate',
        'Export JSON',
        'Delete',
      ])
    })

    it('renders nothing when it has no items, however it is asked to open', () => {
      render(<KeyOpenedHarness items={[]} />)
      fireEvent.keyDown(screen.getByRole('button', { name: 'Item text' }), { key: 'm' })
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('marks the danger item apart from the ordinary ones', async () => {
      const user = userEvent.setup()
      render(<TogglingHarness items={makeItems()} />)
      await user.click(screen.getByRole('button', { name: 'Actions' }))

      expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveClass('text-danger')
      expect(screen.getByRole('menuitem', { name: 'Duplicate' })).not.toHaveClass('text-danger')
    })
  })

  describe('trigger wiring (A11Y-015)', () => {
    it('declares popup semantics and the collapsed state before opening', () => {
      render(<TogglingHarness items={makeItems()} />)
      const trigger = screen.getByRole('button', { name: 'Actions' })
      expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(trigger).not.toHaveAttribute('aria-controls')
    })

    it('flips aria-expanded and points aria-controls at the open menu', async () => {
      const user = userEvent.setup()
      render(<TogglingHarness items={makeItems()} />)
      const trigger = screen.getByRole('button', { name: 'Actions' })
      await user.click(trigger)

      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(trigger).toHaveAttribute('aria-controls', screen.getByRole('menu').id)
      expect(screen.getByRole('menu')).toHaveAttribute('id', MENU_ID)
    })
  })

  describe('keyboard', () => {
    it('focuses the first item as soon as the menu opens', async () => {
      const user = userEvent.setup()
      render(<TogglingHarness items={makeItems()} />)
      await user.click(screen.getByRole('button', { name: 'Actions' }))

      expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Duplicate' }))
    })

    it('cycles through items with the arrow keys, wrapping at both ends', async () => {
      const user = userEvent.setup()
      render(<TogglingHarness items={makeItems()} />)
      await user.click(screen.getByRole('button', { name: 'Actions' }))
      const [duplicate, exportJson, del] = screen.getAllByRole('menuitem')

      await user.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(exportJson)
      await user.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(del)
      await user.keyboard('{ArrowDown}')
      expect(document.activeElement).toBe(duplicate)
      await user.keyboard('{ArrowUp}')
      expect(document.activeElement).toBe(del)
    })

    it('closes on Escape and hands focus back to the trigger', async () => {
      const user = userEvent.setup()
      render(<TogglingHarness items={makeItems()} />)
      const trigger = screen.getByRole('button', { name: 'Actions' })
      await user.click(trigger)

      await user.keyboard('{Escape}')
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(document.activeElement).toBe(trigger)
    })

    it('closes on Tab and hands focus back to the trigger', async () => {
      const user = userEvent.setup()
      render(<TogglingHarness items={makeItems()} />)
      const trigger = screen.getByRole('button', { name: 'Actions' })
      await user.click(trigger)

      await user.keyboard('{Tab}')
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(document.activeElement).toBe(trigger)
    })
  })

  describe('selection and dismissal', () => {
    it('runs the item action and closes', async () => {
      const user = userEvent.setup()
      const items = makeItems()
      render(<TogglingHarness items={items} />)
      await user.click(screen.getByRole('button', { name: 'Actions' }))
      await user.click(screen.getByRole('menuitem', { name: 'Export JSON' }))

      expect(items[1].onSelect).toHaveBeenCalledOnce()
      expect(items[0].onSelect).not.toHaveBeenCalled()
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('closes when a press lands outside it', async () => {
      const user = userEvent.setup()
      render(<TogglingHarness items={makeItems()} />)
      await user.click(screen.getByRole('button', { name: 'Actions' }))

      await user.click(screen.getByRole('button', { name: 'Elsewhere' }))
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })

    it('lets a toggling trigger dismiss its own menu, and keeps it dismissed (BUG-005)', async () => {
      const user = userEvent.setup()
      render(<TogglingHarness items={makeItems()} />)
      const trigger = screen.getByRole('button', { name: 'Actions' })

      await user.click(trigger)
      expect(screen.getByRole('menu')).toBeInTheDocument()

      await user.click(trigger)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    })

    it('treats a press on a non-toggling trigger as an outside click', async () => {
      const user = userEvent.setup()
      render(<KeyOpenedHarness items={makeItems()} />)
      const trigger = screen.getByRole('button', { name: 'Item text' })
      fireEvent.keyDown(trigger, { key: 'm' })
      expect(screen.getByRole('menu')).toBeInTheDocument()

      await user.click(trigger)
      expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    })
  })
})
