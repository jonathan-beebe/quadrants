import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ThemeToggleButton from '../components/atoms/ThemeToggleButton'

describe('ThemeToggleButton', () => {
  it('shows light-mode label and calls onCycle when in light mode', async () => {
    const onCycle = vi.fn()
    render(<ThemeToggleButton mode="light" darkMode={false} onCycle={onCycle} />)
    const btn = screen.getByRole('button', { name: /using light theme, switch to dark mode/i })
    expect(btn).toBeInTheDocument()
    await userEvent.setup().click(btn)
    expect(onCycle).toHaveBeenCalledOnce()
  })

  it('shows dark-mode label when in dark mode', () => {
    render(<ThemeToggleButton mode="dark" darkMode={true} onCycle={() => {}} />)
    expect(
      screen.getByRole('button', { name: /using dark theme, switch to system theme/i }),
    ).toBeInTheDocument()
  })

  it('shows system-mode label with resolved light state', () => {
    render(<ThemeToggleButton mode="system" darkMode={false} onCycle={() => {}} />)
    expect(
      screen.getByRole('button', { name: /following system theme \(light\)/i }),
    ).toBeInTheDocument()
  })

  it('shows system-mode label with resolved dark state', () => {
    render(<ThemeToggleButton mode="system" darkMode={true} onCycle={() => {}} />)
    expect(
      screen.getByRole('button', { name: /following system theme \(dark\)/i }),
    ).toBeInTheDocument()
  })

  it('renders a small stacked sun icon in system mode', () => {
    const { container } = render(
      <ThemeToggleButton mode="system" darkMode={false} onCycle={() => {}} />,
    )
    // System mode: base icon + small stacked sun = 2 SVGs
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(2)
  })

  it('renders a single icon in light or dark mode', () => {
    const { container } = render(
      <ThemeToggleButton mode="light" darkMode={false} onCycle={() => {}} />,
    )
    const svgs = container.querySelectorAll('svg')
    expect(svgs.length).toBe(1)
  })
})
