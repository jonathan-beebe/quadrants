import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FrameworkBuilder from '../components/FrameworkBuilder'
import { useIsMobile } from '../hooks/useIsMobile'

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

const defaultProps = {
  editing: null,
  onCreate: vi.fn(),
  onCancel: vi.fn(),
}

const editingFramework = {
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

describe('FrameworkBuilder', () => {
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false)
  })

  it('shows "Create Framework" heading when not editing', () => {
    render(<FrameworkBuilder {...defaultProps} />)
    expect(screen.getByRole('heading', { name: 'Create Framework' })).toBeInTheDocument()
  })

  it('shows "Edit Framework" heading when editing', () => {
    render(<FrameworkBuilder {...defaultProps} editing={editingFramework} />)
    expect(screen.getByRole('heading', { name: 'Edit Framework' })).toBeInTheDocument()
  })

  it('shows the template list when not editing', () => {
    render(<FrameworkBuilder {...defaultProps} />)
    expect(screen.getByRole('button', { name: /Eisenhower Matrix/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Blank \/ Custom/ })).toBeInTheDocument()
  })

  it('hides the template list when editing', () => {
    render(<FrameworkBuilder {...defaultProps} editing={editingFramework} />)
    expect(screen.queryByRole('button', { name: /Eisenhower Matrix/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox', { name: /filter templates/i })).not.toBeInTheDocument()
  })

  it('groups templates by category', () => {
    render(<FrameworkBuilder {...defaultProps} />)
    expect(screen.getByRole('heading', { name: 'Prioritize' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Strategize' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Retrospect' })).toBeInTheDocument()
  })

  it('populates the detail form from a template when its list entry is clicked', async () => {
    const user = userEvent.setup()
    render(<FrameworkBuilder {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Eisenhower Matrix/ }))

    expect(screen.getByDisplayValue('Eisenhower Matrix')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Do First')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Schedule')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Delegate')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Eliminate')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Urgency')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Importance')).toBeInTheDocument()
  })

  it('updates the detail in place when a different template is selected', async () => {
    const user = userEvent.setup()
    render(<FrameworkBuilder {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Eisenhower Matrix/ }))
    expect(screen.getByDisplayValue('Eisenhower Matrix')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Risk Matrix/ }))
    expect(screen.getByDisplayValue('Risk Matrix')).toBeInTheDocument()
    // The previous template's labels are gone.
    expect(screen.queryByDisplayValue('Eisenhower Matrix')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('Mitigate Now')).toBeInTheDocument()
  })

  it('marks the selected template entry as current', async () => {
    const user = userEvent.setup()
    render(<FrameworkBuilder {...defaultProps} />)

    const eisenhower = screen.getByRole('button', { name: /Eisenhower Matrix/ })
    await user.click(eisenhower)
    expect(eisenhower).toHaveAttribute('aria-current', 'true')
  })

  it('the "Blank / Custom" entry yields an empty editable form', async () => {
    const user = userEvent.setup()
    render(<FrameworkBuilder {...defaultProps} />)

    // Pick a template first, then return to Custom.
    await user.click(screen.getByRole('button', { name: /Eisenhower Matrix/ }))
    expect(screen.getByDisplayValue('Eisenhower Matrix')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Blank \/ Custom/ }))
    expect(screen.queryByDisplayValue('Eisenhower Matrix')).not.toBeInTheDocument()
    // All four quadrant inputs are empty.
    const quadrantInputs = screen.getAllByRole('textbox', { name: /Quadrant \d label/ })
    expect(quadrantInputs).toHaveLength(4)
    for (const input of quadrantInputs) {
      expect(input).toHaveValue('')
    }
  })

  it('filters the list by name as the user types', async () => {
    const user = userEvent.setup()
    render(<FrameworkBuilder {...defaultProps} />)

    await user.type(screen.getByRole('searchbox', { name: /filter templates/i }), 'risk')

    expect(screen.getByRole('button', { name: /Risk Matrix/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Eisenhower Matrix/ })).not.toBeInTheDocument()
  })

  it('disables submit when form is incomplete', () => {
    render(<FrameworkBuilder {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Create Framework' })).toBeDisabled()
  })

  it('enables submit when a template is selected', async () => {
    const user = userEvent.setup()
    render(<FrameworkBuilder {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Start \/ Stop/ }))

    expect(screen.getByRole('button', { name: 'Create Framework' })).toBeEnabled()
  })

  it('calls onCreate with form data including colors on submit', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<FrameworkBuilder {...defaultProps} onCreate={onCreate} />)

    await user.click(screen.getByRole('button', { name: /Start \/ Stop/ }))
    await user.click(screen.getByRole('button', { name: 'Create Framework' }))

    expect(onCreate).toHaveBeenCalledWith({
      name: 'Start / Stop / Continue / Change',
      axisX: 'Existing / New',
      axisY: 'Rethink / Embrace',
      quadrants: ['Continue', 'Start', 'Stop', 'Change'],
      colors: ['#4ade80', '#60a5fa', '#ef4444', '#fbbf24'],
    })
  })

  // FEAT-002: a picked template's colors must survive submission so the created
  // framework renders the spec palette — not the default fallback.
  it('passes the template colors through to onCreate', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<FrameworkBuilder {...defaultProps} onCreate={onCreate} />)

    await user.click(screen.getByRole('button', { name: /Eisenhower Matrix/ }))
    await user.click(screen.getByRole('button', { name: 'Create Framework' }))

    expect(onCreate.mock.calls[0][0].colors).toEqual(['#60a5fa', '#4ade80', '#94a3b8', '#fbbf24'])
  })

  // FEAT-002: the quadrant preview boxes must reflect the picked template's
  // colors, not the hardcoded defaults.
  it('previews the picked template colors on the quadrant boxes', async () => {
    const user = userEvent.setup()
    render(<FrameworkBuilder {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Eisenhower Matrix/ }))

    // Schedule is Eisenhower's first quadrant — blue (#60a5fa → rgb 96,165,250).
    const scheduleInput = screen.getByDisplayValue('Schedule')
    expect(scheduleInput.style.background).toBe('rgba(96, 165, 250, 0.08)')
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<FrameworkBuilder {...defaultProps} onCancel={onCancel} />)

    await user.click(screen.getAllByText('Cancel')[0])
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('pre-fills form when editing an existing framework', () => {
    render(<FrameworkBuilder {...defaultProps} editing={editingFramework} />)

    expect(screen.getByDisplayValue('My Framework')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alpha')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Horizontal')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Vertical')).toBeInTheDocument()
  })

  describe('mobile (list collapses into a dropdown)', () => {
    beforeEach(() => {
      vi.mocked(useIsMobile).mockReturnValue(true)
    })

    it('keeps the editable detail visible without opening the list', () => {
      render(<FrameworkBuilder {...defaultProps} />)
      // The detail form (preview) is present as main content.
      expect(screen.getAllByRole('textbox', { name: /Quadrant \d label/ })).toHaveLength(4)
      // The list is collapsed: template options are not in the DOM yet.
      expect(screen.queryByRole('button', { name: /Eisenhower Matrix/ })).not.toBeInTheDocument()
    })

    it('reveals the list when the dropdown trigger is clicked', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilder {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /choose a template/i })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      await user.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('button', { name: /Eisenhower Matrix/ })).toBeInTheDocument()
    })

    it('closes the dropdown on Escape', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilder {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /choose a template/i })
      await user.click(trigger)
      expect(screen.getByRole('button', { name: /Eisenhower Matrix/ })).toBeInTheDocument()

      fireEvent.keyDown(screen.getByRole('searchbox', { name: /filter templates/i }), { key: 'Escape' })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('button', { name: /Eisenhower Matrix/ })).not.toBeInTheDocument()
    })

    it('selecting a template from the dropdown closes it and fills the detail', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilder {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /choose a template/i })
      await user.click(trigger)
      await user.click(screen.getByRole('button', { name: /Eisenhower Matrix/ }))

      // Dropdown closed (filter input gone), detail filled.
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('searchbox', { name: /filter templates/i })).not.toBeInTheDocument()
      expect(screen.getByDisplayValue('Eisenhower Matrix')).toBeInTheDocument()
    })
  })
})
