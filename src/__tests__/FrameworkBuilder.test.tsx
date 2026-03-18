import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FrameworkBuilder from '../components/FrameworkBuilder'

const defaultProps = {
  editing: null,
  onCreate: vi.fn(),
  onCancel: vi.fn(),
}

describe('FrameworkBuilder', () => {
  it('shows "Create Framework" heading when not editing', () => {
    render(<FrameworkBuilder {...defaultProps} />)
    expect(screen.getByRole('heading', { name: 'Create Framework' })).toBeInTheDocument()
  })

  it('shows "Edit Framework" heading when editing', () => {
    const editing = {
      id: 'fw-1',
      name: 'Existing',
      axisX: 'X',
      axisY: 'Y',
      quadrants: [
        { label: 'A', color: '#fbbf24', items: [] },
        { label: 'B', color: '#60a5fa', items: [] },
        { label: 'C', color: '#34d399', items: [] },
        { label: 'D', color: '#f472b6', items: [] },
      ],
      createdAt: 1000,
      updatedAt: 1000,
    }
    render(<FrameworkBuilder {...defaultProps} editing={editing} />)
    expect(screen.getByRole('heading', { name: 'Edit Framework' })).toBeInTheDocument()
  })

  it('shows templates when not editing', () => {
    render(<FrameworkBuilder {...defaultProps} />)
    expect(screen.getByText('Start from a template')).toBeInTheDocument()
    // Template names appear as button text
    expect(screen.getByRole('button', { name: /Urgent-Important Matrix/ })).toBeInTheDocument()
  })

  it('hides templates when editing', () => {
    const editing = {
      id: 'fw-1',
      name: 'Existing',
      axisX: '',
      axisY: '',
      quadrants: [
        { label: 'A', color: '#fbbf24', items: [] },
        { label: 'B', color: '#60a5fa', items: [] },
        { label: 'C', color: '#34d399', items: [] },
        { label: 'D', color: '#f472b6', items: [] },
      ],
      createdAt: 1000,
      updatedAt: 1000,
    }
    render(<FrameworkBuilder {...defaultProps} editing={editing} />)
    expect(screen.queryByText('Start from a template')).not.toBeInTheDocument()
  })

  it('populates form fields from a template when clicked', async () => {
    const user = userEvent.setup()
    render(<FrameworkBuilder {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Urgent-Important Matrix/ }))

    expect(screen.getByDisplayValue('Urgent-Important Matrix')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Do First')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Schedule')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Delegate')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Eliminate')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Urgency')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Importance')).toBeInTheDocument()
  })

  it('disables submit when form is incomplete', () => {
    render(<FrameworkBuilder {...defaultProps} />)
    const submitBtn = screen.getByRole('button', { name: 'Create Framework' })
    expect(submitBtn).toBeDisabled()
  })

  it('enables submit when all required fields are filled', async () => {
    const user = userEvent.setup()
    render(<FrameworkBuilder {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Start \/ Stop/ }))

    const submitBtn = screen.getByRole('button', { name: 'Create Framework' })
    expect(submitBtn).toBeEnabled()
  })

  it('calls onCreate with form data on submit', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<FrameworkBuilder {...defaultProps} onCreate={onCreate} />)

    await user.click(screen.getByRole('button', { name: /Start \/ Stop/ }))
    await user.click(screen.getByRole('button', { name: 'Create Framework' }))

    expect(onCreate).toHaveBeenCalledWith({
      name: 'Start / Stop / Continue / Change',
      axisX: '',
      axisY: '',
      quadrants: ['Start', 'Stop', 'Continue', 'Change'],
    })
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<FrameworkBuilder {...defaultProps} onCancel={onCancel} />)

    await user.click(screen.getAllByText('Cancel')[0])
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('pre-fills form when editing an existing framework', () => {
    const editing = {
      id: 'fw-1',
      name: 'My Framework',
      axisX: 'Horizontal',
      axisY: 'Vertical',
      quadrants: [
        { label: 'Alpha', color: '#fbbf24', items: [] },
        { label: 'Beta', color: '#60a5fa', items: [] },
        { label: 'Gamma', color: '#34d399', items: [] },
        { label: 'Delta', color: '#f472b6', items: [] },
      ],
      createdAt: 1000,
      updatedAt: 1000,
    }
    render(<FrameworkBuilder {...defaultProps} editing={editing} />)

    expect(screen.getByDisplayValue('My Framework')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alpha')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Horizontal')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Vertical')).toBeInTheDocument()
  })
})
