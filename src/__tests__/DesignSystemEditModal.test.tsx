import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DesignSystem from '../components/DesignSystem'
import { useOnScreenKeyboardSignals } from '../hooks/useExpectsOnScreenKeyboard'

vi.mock('../hooks/useExpectsOnScreenKeyboard', () => ({
  useOnScreenKeyboardSignals: vi.fn(() => DESKTOP),
}))

const DESKTOP = { coarsePointer: false, noHover: false, uaMobile: false, observed: null }
const PHONE = { coarsePointer: true, noHover: true, uaMobile: true, observed: null }

/** Drives the demo through the real precedence rules rather than past them. */
function simulate(signals: typeof DESKTOP) {
  vi.mocked(useOnScreenKeyboardSignals).mockReturnValue(signals)
}

const field = () => screen.getByLabelText(/^Item text/)
// The design system renders Cancel/Delete buttons in other sections too, so
// every modal query is scoped to the dialog.
const modal = () => within(screen.getByRole('dialog', { name: 'Edit item' }))

afterEach(() => {
  simulate(DESKTOP)
})

describe('DesignSystem — Edit Modal gated on on-screen-keyboard detection', () => {
  it('edits in place where a physical keyboard is expected', async () => {
    const user = userEvent.setup()
    render(<DesignSystem />)

    expect(field()).not.toHaveAttribute('readonly')
    expect(field()).not.toHaveAttribute('aria-haspopup')

    await user.click(field())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the modal where an on-screen keyboard is expected', async () => {
    simulate(PHONE)
    const user = userEvent.setup()
    render(<DesignSystem />)

    expect(field()).toHaveAttribute('readonly')
    expect(field()).toHaveAttribute('aria-haspopup', 'dialog')

    await user.click(field())
    expect(screen.getByRole('dialog', { name: 'Edit item' })).toBeInTheDocument()
  })

  it('saves through the modal back into the field', async () => {
    simulate(PHONE)
    const user = userEvent.setup()
    render(<DesignSystem />)

    await user.click(field())
    await user.clear(modal().getByRole('textbox', { name: 'Item text' }))
    await user.type(modal().getByRole('textbox', { name: 'Item text' }), 'Ship v3 release')
    await user.click(modal().getByRole('button', { name: 'Save' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(field()).toHaveValue('Ship v3 release')
    // A11Y-022: focus returns to the trigger, not <body>.
    expect(field()).toHaveFocus()
  })

  it('leaves the field untouched on cancel', async () => {
    simulate(PHONE)
    const user = userEvent.setup()
    render(<DesignSystem />)

    await user.click(field())
    await user.type(modal().getByRole('textbox', { name: 'Item text' }), ' edited')
    await user.click(modal().getByRole('button', { name: 'Cancel' }))

    expect(field()).toHaveValue('Ship v2 release')
    expect(field()).toHaveFocus() // A11Y-022
  })

  it('closes via the X, discarding the edit', async () => {
    simulate(PHONE)
    const user = userEvent.setup()
    render(<DesignSystem />)

    await user.click(field())
    await user.click(modal().getByRole('button', { name: 'Close Edit item' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(field()).toHaveValue('Ship v2 release')
    expect(field()).toHaveFocus() // A11Y-022
  })

  it('reports the delete it would have performed, and closes', async () => {
    simulate(PHONE)
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const user = userEvent.setup()
    render(<DesignSystem />)

    await user.click(field())
    await user.click(modal().getByRole('button', { name: 'Delete' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(alert).toHaveBeenCalledWith(expect.stringMatching(/delete/i))
    expect(field()).toHaveFocus() // A11Y-022
    alert.mockRestore()
  })

  it('lets a desktop reviewer preview the modal the verdict would withhold', async () => {
    const user = userEvent.setup()
    render(<DesignSystem />)

    // Without this escape hatch the component is unreviewable on the machine
    // it is being designed on.
    await user.click(screen.getByLabelText(/Preview the modal on this device/))
    await user.click(field())

    expect(screen.getByRole('dialog', { name: 'Edit item' })).toBeInTheDocument()
  })
})
