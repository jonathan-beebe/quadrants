import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DesignSystem from '../components/DesignSystem'

// IMPRV-009: the design system demonstrates the shared Modal with content long
// enough to scroll, proving the title bar stays out of the scroll region.
describe('DesignSystem — shared Modal', () => {
  it('opens the demo modal from its trigger, content long enough to scroll', async () => {
    const user = userEvent.setup()
    render(<DesignSystem />)

    await user.click(screen.getByRole('button', { name: 'Open Modal' }))

    const modal = within(screen.getByRole('dialog', { name: 'Modal demo' }))
    expect(modal.getByRole('heading', { name: 'Modal demo' })).toBeInTheDocument()
    // The demo's child owns the scrolling, not the modal's content area.
    const scroller = modal.getByText(/scrolling content block 1 —/i).parentElement
    expect(scroller).toHaveClass('overflow-y-auto')
    expect(modal.getByText(/scrolling content block 12 —/i)).toBeInTheDocument()
  })

  it('closes from the title bar and returns focus to the trigger', async () => {
    const user = userEvent.setup()
    render(<DesignSystem />)

    const trigger = screen.getByRole('button', { name: 'Open Modal' })
    await user.click(trigger)
    await user.click(screen.getByRole('button', { name: 'Close Modal demo' }))

    expect(screen.queryByRole('dialog', { name: 'Modal demo' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
