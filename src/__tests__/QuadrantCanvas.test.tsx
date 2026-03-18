import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuadrantCanvas from '../components/QuadrantCanvas'
import type { Framework } from '../types'

function makeFramework(overrides: Partial<Framework> = {}): Framework {
  return {
    id: 'fw-1',
    name: 'Test Framework',
    axisX: 'Urgency',
    axisY: 'Importance',
    quadrants: [
      { label: 'Do First', color: '#fbbf24', items: [{ id: 'i1', text: 'Task A', x: 10, y: 10, createdAt: 1000 }] },
      { label: 'Schedule', color: '#60a5fa', items: [] },
      { label: 'Delegate', color: '#34d399', items: [] },
      { label: 'Eliminate', color: '#f472b6', items: [] },
    ],
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  }
}

const defaultProps = {
  framework: makeFramework(),
  sidebarOpen: true,
  onUpdate: vi.fn(),
  onReflect: vi.fn(),
  onEdit: vi.fn(),
  onShare: vi.fn(),
}

describe('QuadrantCanvas', () => {
  it('displays the framework name', () => {
    render(<QuadrantCanvas {...defaultProps} />)
    expect(screen.getByText('Test Framework')).toBeInTheDocument()
  })

  it('renders all four quadrant labels', () => {
    render(<QuadrantCanvas {...defaultProps} />)
    expect(screen.getByText('Do First')).toBeInTheDocument()
    expect(screen.getByText('Schedule')).toBeInTheDocument()
    expect(screen.getByText('Delegate')).toBeInTheDocument()
    expect(screen.getByText('Eliminate')).toBeInTheDocument()
  })

  it('displays axis labels when present', () => {
    render(<QuadrantCanvas {...defaultProps} />)
    expect(screen.getByText('Urgency')).toBeInTheDocument()
    expect(screen.getByText('Importance')).toBeInTheDocument()
  })

  it('hides axis labels when not set', () => {
    const fw = makeFramework({ axisX: '', axisY: '' })
    render(<QuadrantCanvas {...defaultProps} framework={fw} />)
    expect(screen.queryByText('Urgency')).not.toBeInTheDocument()
    expect(screen.queryByText('Importance')).not.toBeInTheDocument()
  })

  it('renders existing items in their quadrants', () => {
    render(<QuadrantCanvas {...defaultProps} />)
    expect(screen.getByText('Task A')).toBeInTheDocument()
  })

  it('shows item counts per quadrant', () => {
    render(<QuadrantCanvas {...defaultProps} />)
    // The "Do First" quadrant has 1 item, others have 0
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('calls onEdit when Edit button is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<QuadrantCanvas {...defaultProps} onEdit={onEdit} />)
    await user.click(screen.getByText('Edit'))
    expect(onEdit).toHaveBeenCalledOnce()
  })

  it('calls onReflect when Reflect button is clicked', async () => {
    const user = userEvent.setup()
    const onReflect = vi.fn()
    render(<QuadrantCanvas {...defaultProps} onReflect={onReflect} />)
    await user.click(screen.getByText('Reflect'))
    expect(onReflect).toHaveBeenCalledOnce()
  })

  it('calls onShare when Share button is clicked', async () => {
    const user = userEvent.setup()
    const onShare = vi.fn().mockResolvedValue('http://example.com')
    render(<QuadrantCanvas {...defaultProps} onShare={onShare} />)
    await user.click(screen.getByText('Share'))
    expect(onShare).toHaveBeenCalledWith(defaultProps.framework)
  })

  it('calls onUpdate when add item button is clicked', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(<QuadrantCanvas {...defaultProps} onUpdate={onUpdate} />)

    // Each quadrant has an "Add item" button with aria-label
    const addButtons = screen.getAllByRole('button', { name: /Add item to/ })
    expect(addButtons).toHaveLength(4)

    await user.click(addButtons[0])
    expect(onUpdate).toHaveBeenCalledOnce()
    // The updated framework should have one more item in the first quadrant
    const updatedFw = onUpdate.mock.calls[0][0]
    expect(updatedFw.quadrants[0].items).toHaveLength(2)
  })
})
