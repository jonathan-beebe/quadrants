import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useRef, useState } from 'react'
import Modal from '../components/Modal'
import { useIsMobile } from '../hooks/useIsMobile'

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

function renderModal(children: React.ReactNode = <p>Modal body</p>, onClose = vi.fn()) {
  render(
    <Modal title="Demo Modal" onClose={onClose}>
      {children}
    </Modal>,
  )
  return onClose
}

// IMPRV-009: one reusable component owns modal chrome — title bar with close,
// content area the children scroll themselves, dialog semantics per the
// A11Y-016/021/022 lineage.
describe('Modal', () => {
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false)
  })

  it('presents a dialog named by its title', () => {
    renderModal()
    const dialog = screen.getByRole('dialog', { name: 'Demo Modal' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('heading', { name: 'Demo Modal' })).toBeInTheDocument()
  })

  it('hosts arbitrary children in the content area', () => {
    renderModal(<p>Arbitrary content</p>)
    expect(screen.getByText('Arbitrary content')).toBeInTheDocument()
  })

  it('keeps the title bar out of the scroll region — the content area never scrolls itself', () => {
    renderModal(<p>Modal body</p>)
    const contentArea = screen.getByText('Modal body').parentElement
    expect(contentArea).not.toHaveClass('overflow-y-auto')
    // The bar is a shrink-0 sibling above the content, so however tall the
    // content grows, the bar cannot leave the top of the dialog.
    const titleBar = screen.getByRole('heading', { name: 'Demo Modal' }).parentElement
    expect(titleBar).toHaveClass('shrink-0')
  })

  it('closes via the labeled close button', async () => {
    const user = userEvent.setup()
    const onClose = renderModal()
    await user.click(screen.getByRole('button', { name: 'Close Demo Modal' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('closes on Escape', () => {
    const onClose = renderModal()
    fireEvent.keyDown(screen.getByRole('dialog', { name: 'Demo Modal' }), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('moves focus into the dialog when it opens', () => {
    renderModal()
    const dialog = screen.getByRole('dialog', { name: 'Demo Modal' })
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('lets an autofocusing child claim the initial focus instead', () => {
    renderModal(<input autoFocus aria-label="Name" />)
    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveFocus()
  })

  it('returns focus to the opener when it closes (A11Y-022)', async () => {
    const user = userEvent.setup()
    function Host() {
      const [open, setOpen] = useState(false)
      const openerRef = useRef<HTMLButtonElement>(null)
      return (
        <>
          <button ref={openerRef} onClick={() => setOpen(true)}>
            Open it
          </button>
          {open && (
            <Modal title="Demo Modal" openerRef={openerRef} onClose={() => setOpen(false)}>
              <p>Modal body</p>
            </Modal>
          )}
        </>
      )
    }
    render(<Host />)

    await user.click(screen.getByRole('button', { name: 'Open it' }))
    await user.click(screen.getByRole('button', { name: 'Close Demo Modal' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Open it' })).toHaveFocus()
  })

  it('presents centered on wide screens', () => {
    renderModal()
    const dialog = screen.getByRole('dialog', { name: 'Demo Modal' })
    expect(dialog).toHaveClass('rounded-2xl')
    expect(dialog.parentElement).toHaveClass('items-center', 'justify-center')
  })

  it('presents full screen on mobile', () => {
    vi.mocked(useIsMobile).mockReturnValue(true)
    renderModal()
    const dialog = screen.getByRole('dialog', { name: 'Demo Modal' })
    expect(dialog).toHaveClass('w-full', 'h-full')
    expect(dialog).not.toHaveClass('rounded-2xl')
  })
})
