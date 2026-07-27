import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import EditModal from '../components/EditModal'

function setup(overrides: Partial<React.ComponentProps<typeof EditModal>> = {}) {
  const props = {
    title: 'Edit item',
    value: 'Ship v2 release',
    onSave: vi.fn(),
    onDelete: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  }
  render(<EditModal {...props} />)
  return props
}

describe('EditModal', () => {
  it('opens with the current text, focused and selected so typing replaces it', () => {
    setup()
    const field = screen.getByRole('textbox')
    expect(field).toHaveValue('Ship v2 release')
    expect(field).toHaveFocus()
  })

  it('saves the edited text', async () => {
    const user = userEvent.setup()
    const { onSave } = setup()

    await user.clear(screen.getByRole('textbox'))
    await user.type(screen.getByRole('textbox'), 'Ship v3 release')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(onSave).toHaveBeenCalledWith('Ship v3 release')
  })

  it('discards the edit on cancel — the typed text is never handed back', async () => {
    const user = userEvent.setup()
    const { onCancel, onSave } = setup()

    await user.type(screen.getByRole('textbox'), ' and more')
    await user.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(onCancel).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('discards the edit when the close X is used', async () => {
    const user = userEvent.setup()
    const { onCancel, onSave } = setup()

    await user.click(screen.getByRole('button', { name: 'Close Edit item' }))

    expect(onCancel).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('deletes without saving pending edits', async () => {
    const user = userEvent.setup()
    const { onDelete, onSave } = setup()

    await user.type(screen.getByRole('textbox'), ' edited')
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(onDelete).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('cancels on Escape', async () => {
    const user = userEvent.setup()
    const { onCancel } = setup()

    await user.keyboard('{Escape}')

    expect(onCancel).toHaveBeenCalled()
  })

  it('is a labelled modal dialog', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Edit item' })).toHaveAttribute('aria-modal', 'true')
  })

  it('gives each instance its own label and field ids, so two can coexist', () => {
    const { unmount } = render(
      <EditModal title="First" value="a" onSave={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />,
    )
    const first = screen.getByRole('dialog').getAttribute('aria-labelledby')
    unmount()

    render(<EditModal title="Second" value="b" onSave={vi.fn()} onDelete={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByRole('dialog').getAttribute('aria-labelledby')).not.toBe(first)
  })
})
