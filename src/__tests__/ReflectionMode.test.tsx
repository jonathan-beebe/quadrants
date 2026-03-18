import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ReflectionMode from '../components/ReflectionMode'
import type { Framework } from '../types'

function makeFramework(): Framework {
  return {
    id: 'fw-1',
    name: 'Test',
    axisX: '',
    axisY: '',
    quadrants: [
      { label: 'Start', color: '#fbbf24', items: [] },
      { label: 'Stop', color: '#60a5fa', items: [] },
      { label: 'Continue', color: '#34d399', items: [{ id: 'i1', text: 'Existing item', x: 10, y: 10, createdAt: 1000 }] },
      { label: 'Change', color: '#f472b6', items: [] },
    ],
    createdAt: 1000,
    updatedAt: 1000,
  }
}

const defaultProps = {
  framework: makeFramework(),
  onUpdate: vi.fn(),
  onExit: vi.fn(),
}

describe('ReflectionMode', () => {
  it('renders all quadrant tabs', () => {
    render(<ReflectionMode {...defaultProps} />)
    expect(screen.getByRole('tab', { name: /Start/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Stop/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Continue/ })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /Change/ })).toBeInTheDocument()
  })

  it('shows the first quadrant by default', () => {
    render(<ReflectionMode {...defaultProps} />)
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Start')
  })

  it('switches quadrant when a tab is clicked', async () => {
    const user = userEvent.setup()
    render(<ReflectionMode {...defaultProps} />)

    await user.click(screen.getByRole('tab', { name: /Continue/ }))
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Continue')
    expect(screen.getByText('Existing item')).toBeInTheDocument()
  })

  it('adds an item when text is submitted', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(<ReflectionMode {...defaultProps} onUpdate={onUpdate} />)

    const input = screen.getByPlaceholderText('Add to "Start"...')
    await user.type(input, 'New idea{Enter}')

    expect(onUpdate).toHaveBeenCalledOnce()
    const updatedFramework = onUpdate.mock.calls[0][0]
    expect(updatedFramework.quadrants[0].items).toHaveLength(1)
    expect(updatedFramework.quadrants[0].items[0].text).toBe('New idea')
  })

  it('clears the input after adding an item', async () => {
    const user = userEvent.setup()
    render(<ReflectionMode {...defaultProps} />)

    const input = screen.getByPlaceholderText('Add to "Start"...')
    await user.type(input, 'Test item{Enter}')

    expect(input).toHaveValue('')
  })

  it('does not add empty items', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(<ReflectionMode {...defaultProps} onUpdate={onUpdate} />)

    const input = screen.getByPlaceholderText('Add to "Start"...')
    await user.type(input, '   {Enter}')

    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('calls onExit when close button is clicked', async () => {
    const user = userEvent.setup()
    const onExit = vi.fn()
    render(<ReflectionMode {...defaultProps} onExit={onExit} />)

    await user.click(screen.getByRole('button', { name: /exit reflection mode/i }))
    expect(onExit).toHaveBeenCalledOnce()
  })

  it('shows empty state when quadrant has no items', () => {
    render(<ReflectionMode {...defaultProps} />)
    expect(screen.getByText('No items yet. Start typing above.')).toBeInTheDocument()
  })

  it('shows keyboard shortcut instructions', () => {
    render(<ReflectionMode {...defaultProps} />)
    expect(screen.getByText(/Enter to add/)).toBeInTheDocument()
    expect(screen.getByText(/Esc to exit/)).toBeInTheDocument()
  })

  it('has proper dialog role and label', () => {
    render(<ReflectionMode {...defaultProps} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-label', expect.stringContaining('Test'))
  })
})
