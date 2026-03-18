import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ColorPicker from '../components/ColorPicker'

const defaultProps = {
  color: '#fbbf24',
  onChange: vi.fn(),
}

describe('ColorPicker', () => {
  it('renders a color swatch button', () => {
    render(<ColorPicker {...defaultProps} />)
    expect(screen.getByTitle('Change color')).toBeInTheDocument()
  })

  it('opens the picker when the swatch is clicked', async () => {
    const user = userEvent.setup()
    render(<ColorPicker {...defaultProps} />)

    await user.click(screen.getByTitle('Change color'))
    // Should show the preset grid and the custom color input
    expect(screen.getByText('Custom')).toBeInTheDocument()
  })

  it('calls onChange when a preset color is clicked', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ColorPicker {...defaultProps} onChange={onChange} />)

    await user.click(screen.getByTitle('Change color'))

    // Click the red preset (the 10 preset buttons are rendered)
    const presetButtons = screen.getAllByRole('button').filter(
      (btn) => btn.style.background && btn !== screen.getByTitle('Change color')
    )
    expect(presetButtons.length).toBe(10)

    // Click one that's different from the current color
    await user.click(presetButtons[2]) // red (#ef4444)
    expect(onChange).toHaveBeenCalledWith('#ef4444')
  })

  it('closes the picker after selecting a preset', async () => {
    const user = userEvent.setup()
    render(<ColorPicker {...defaultProps} />)

    await user.click(screen.getByTitle('Change color'))
    expect(screen.getByText('Custom')).toBeInTheDocument()

    const presetButtons = screen.getAllByRole('button').filter(
      (btn) => btn.style.background && btn !== screen.getByTitle('Change color')
    )
    await user.click(presetButtons[0])
    expect(screen.queryByText('Custom')).not.toBeInTheDocument()
  })

  it('shows the current color as selected', async () => {
    const user = userEvent.setup()
    render(<ColorPicker {...defaultProps} color="#ef4444" />)

    await user.click(screen.getByTitle('Change color'))

    // The selected preset should have a distinct border style
    const presetButtons = screen.getAllByRole('button').filter(
      (btn) => btn.style.background && btn !== screen.getByTitle('Change color')
    )
    const redButton = presetButtons[2] // #ef4444
    expect(redButton.className).toContain('border-text')
  })

  it('provides a native custom color input', async () => {
    const user = userEvent.setup()
    render(<ColorPicker {...defaultProps} />)

    await user.click(screen.getByTitle('Change color'))

    const colorInput = screen.getByDisplayValue('#fbbf24')
    expect(colorInput).toHaveAttribute('type', 'color')
  })
})
