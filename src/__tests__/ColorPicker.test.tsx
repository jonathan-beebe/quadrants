import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ColorPicker from '../components/ColorPicker'

const defaultProps = {
  color: '#fbbf24',
  onChange: vi.fn(),
}

function getTrigger() {
  return screen.getByRole('button', { name: /change color/i })
}

describe('ColorPicker', () => {
  it('renders a color swatch button', () => {
    render(<ColorPicker {...defaultProps} />)
    expect(getTrigger()).toBeInTheDocument()
  })

  it('opens the picker when the swatch is clicked', async () => {
    const user = userEvent.setup()
    render(<ColorPicker {...defaultProps} />)

    await user.click(getTrigger())
    expect(screen.getByText('Custom')).toBeInTheDocument()
  })

  it('calls onChange when a preset color is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ColorPicker {...defaultProps} onChange={onChange} />)

    await user.click(getTrigger())

    const presetOptions = screen.getAllByRole('option')
    expect(presetOptions).toHaveLength(10)

    // Click Red (#ef4444)
    await user.click(screen.getByRole('option', { name: 'Red' }))
    expect(onChange).toHaveBeenCalledWith('#ef4444')
  })

  it('closes the picker after selecting a preset', async () => {
    const user = userEvent.setup()
    render(<ColorPicker {...defaultProps} />)

    await user.click(getTrigger())
    expect(screen.getByText('Custom')).toBeInTheDocument()

    await user.click(screen.getByRole('option', { name: 'Amber' }))
    expect(screen.queryByText('Custom')).not.toBeInTheDocument()
  })

  it('shows the current color as selected', async () => {
    const user = userEvent.setup()
    render(<ColorPicker {...defaultProps} color="#ef4444" />)

    await user.click(getTrigger())

    const redOption = screen.getByRole('option', { name: 'Red' })
    expect(redOption).toHaveAttribute('aria-selected', 'true')
  })

  it('provides a native custom color input', async () => {
    const user = userEvent.setup()
    render(<ColorPicker {...defaultProps} />)

    await user.click(getTrigger())

    const colorInput = screen.getByDisplayValue('#fbbf24')
    expect(colorInput).toHaveAttribute('type', 'color')
  })

  it('communicates expanded state via aria-expanded', async () => {
    const user = userEvent.setup()
    render(<ColorPicker {...defaultProps} />)

    const trigger = getTrigger()
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })
})
