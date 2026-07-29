import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalTitleBar from '../components/ModalTitleBar'

// RFCTR-020: the title bar Modal and EditModal each carried a copy of.
describe('ModalTitleBar', () => {
  it('names the surface through a heading the dialog can point aria-labelledby at', () => {
    render(<ModalTitleBar title="Edit item" titleId="demo-title" onClose={vi.fn()} />)
    const heading = screen.getByRole('heading', { name: 'Edit item' })
    expect(heading).toHaveAttribute('id', 'demo-title')
  })

  it('labels the close button with what it closes, rather than leaving it bare', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<ModalTitleBar title="Edit item" titleId="demo-title" onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Close Edit item' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('never shrinks, so however tall the content grows the bar stays put', () => {
    render(<ModalTitleBar title="Edit item" titleId="demo-title" onClose={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Edit item' }).parentElement).toHaveClass('shrink-0')
  })

  it('truncates a long title instead of pushing the close button out of reach', () => {
    const title = 'A title long enough to run past the width of any modal this app renders'
    render(<ModalTitleBar title={title} titleId="demo-title" onClose={vi.fn()} />)

    expect(screen.getByRole('heading', { name: title })).toHaveClass('truncate')
    expect(screen.getByRole('button', { name: `Close ${title}` })).toBeInTheDocument()
  })
})
