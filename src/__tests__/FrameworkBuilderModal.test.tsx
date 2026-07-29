import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FrameworkBuilderModal from '../components/FrameworkBuilderModal'
import { useIsMobile } from '../hooks/useIsMobile'

vi.mock('../hooks/useIsMobile', () => ({
  useIsMobile: vi.fn(() => false),
}))

const defaultProps = {
  editingFramework: null,
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

describe('FrameworkBuilderModal', () => {
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false)
  })

  // IMPRV-010: the builder is officially a modal — titled dialog, fixed title
  // bar, closable from the bar, wide enough for the master-detail layout.
  describe('modal presentation', () => {
    it('presents a dialog titled "Create Framework" when not editing', () => {
      render(<FrameworkBuilderModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog', { name: 'Create Framework' })
      expect(within(dialog).getByRole('heading', { name: 'Create Framework' })).toBeInTheDocument()
    })

    it('presents a dialog titled "Edit Framework" when editing', () => {
      render(<FrameworkBuilderModal {...defaultProps} editingFramework={editingFramework} />)
      expect(screen.getByRole('dialog', { name: 'Edit Framework' })).toBeInTheDocument()
    })

    it('reports the title-bar close button through onCancel', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      render(<FrameworkBuilderModal {...defaultProps} onCancel={onCancel} />)

      await user.click(screen.getByRole('button', { name: 'Close Create Framework' }))
      expect(onCancel).toHaveBeenCalledOnce()
    })

    it('reports Escape through onCancel', () => {
      const onCancel = vi.fn()
      render(<FrameworkBuilderModal {...defaultProps} onCancel={onCancel} />)

      fireEvent.keyDown(screen.getByRole('dialog', { name: 'Create Framework' }), { key: 'Escape' })
      expect(onCancel).toHaveBeenCalledOnce()
    })

    it('carries no sidebar toggle — the modal is not a screen', () => {
      vi.mocked(useIsMobile).mockReturnValue(true)
      render(<FrameworkBuilderModal {...defaultProps} />)
      expect(screen.queryByRole('button', { name: /open sidebar/i })).not.toBeInTheDocument()
    })

    it('is wide enough for the desktop master-detail layout', () => {
      render(<FrameworkBuilderModal {...defaultProps} />)
      expect(screen.getByRole('dialog', { name: 'Create Framework' })).toHaveClass('max-w-[860px]')
    })
  })

  it('shows the template list when not editing', () => {
    render(<FrameworkBuilderModal {...defaultProps} />)
    expect(screen.getByRole('button', { name: /Eisenhower Matrix/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Blank \/ Custom/ })).toBeInTheDocument()
  })

  it('hides the template list when editing', () => {
    render(<FrameworkBuilderModal {...defaultProps} editingFramework={editingFramework} />)
    expect(screen.queryByRole('button', { name: /Eisenhower Matrix/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('searchbox', { name: /filter templates/i })).not.toBeInTheDocument()
  })

  it('groups templates by category', () => {
    render(<FrameworkBuilderModal {...defaultProps} />)
    expect(screen.getByRole('heading', { name: 'Prioritize' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Strategize' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Retrospect' })).toBeInTheDocument()
  })

  it('populates the detail form from a template when its list entry is clicked', async () => {
    const user = userEvent.setup()
    render(<FrameworkBuilderModal {...defaultProps} />)

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
    render(<FrameworkBuilderModal {...defaultProps} />)

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
    render(<FrameworkBuilderModal {...defaultProps} />)

    const eisenhower = screen.getByRole('button', { name: /Eisenhower Matrix/ })
    await user.click(eisenhower)
    expect(eisenhower).toHaveAttribute('aria-current', 'true')
  })

  it('the "Blank / Custom" entry yields an empty editable form', async () => {
    const user = userEvent.setup()
    render(<FrameworkBuilderModal {...defaultProps} />)

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
    render(<FrameworkBuilderModal {...defaultProps} />)

    await user.type(screen.getByRole('searchbox', { name: /filter templates/i }), 'risk')

    expect(screen.getByRole('button', { name: /Risk Matrix/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Eisenhower Matrix/ })).not.toBeInTheDocument()
  })

  it('disables submit when form is incomplete', () => {
    render(<FrameworkBuilderModal {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'Create Framework' })).toBeDisabled()
  })

  it('enables submit when a template is selected', async () => {
    const user = userEvent.setup()
    render(<FrameworkBuilderModal {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Start \/ Stop/ }))

    expect(screen.getByRole('button', { name: 'Create Framework' })).toBeEnabled()
  })

  it('calls onCreate with form data including colors on submit', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()
    render(<FrameworkBuilderModal {...defaultProps} onCreate={onCreate} />)

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
    render(<FrameworkBuilderModal {...defaultProps} onCreate={onCreate} />)

    await user.click(screen.getByRole('button', { name: /Eisenhower Matrix/ }))
    await user.click(screen.getByRole('button', { name: 'Create Framework' }))

    expect(onCreate.mock.calls[0][0].colors).toEqual(['#60a5fa', '#4ade80', '#94a3b8', '#fbbf24'])
  })

  // FEAT-002: the quadrant preview boxes must reflect the picked template's
  // colors, not the hardcoded defaults.
  it('previews the picked template colors on the quadrant boxes', async () => {
    const user = userEvent.setup()
    render(<FrameworkBuilderModal {...defaultProps} />)

    await user.click(screen.getByRole('button', { name: /Eisenhower Matrix/ }))

    // Schedule is Eisenhower's first quadrant — blue (#60a5fa → rgb 96,165,250).
    const scheduleInput = screen.getByDisplayValue('Schedule')
    expect(scheduleInput.style.background).toBe('rgba(96, 165, 250, 0.08)')
  })

  it('calls onCancel when the form cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<FrameworkBuilderModal {...defaultProps} onCancel={onCancel} />)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('pre-fills form when editing an existing framework', () => {
    render(<FrameworkBuilderModal {...defaultProps} editingFramework={editingFramework} />)

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
      render(<FrameworkBuilderModal {...defaultProps} />)
      // The detail form (preview) is present as main content.
      expect(screen.getAllByRole('textbox', { name: /Quadrant \d label/ })).toHaveLength(4)
      // The list is collapsed: template options are not in the DOM yet.
      expect(screen.queryByRole('button', { name: /Eisenhower Matrix/ })).not.toBeInTheDocument()
    })

    it('reveals the list when the dropdown trigger is clicked', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderModal {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /choose a template/i })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')

      await user.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByRole('button', { name: /Eisenhower Matrix/ })).toBeInTheDocument()
    })

    it('closes the open dropdown when its own trigger is clicked again (BUG-005)', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderModal {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /choose a template/i })
      await user.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'true')

      await user.click(trigger)
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('button', { name: /Eisenhower Matrix/ })).not.toBeInTheDocument()
    })

    it('closes the dropdown on Escape without closing the builder modal', async () => {
      const user = userEvent.setup()
      const onCancel = vi.fn()
      render(<FrameworkBuilderModal {...defaultProps} onCancel={onCancel} />)

      const trigger = screen.getByRole('button', { name: /choose a template/i })
      await user.click(trigger)
      expect(screen.getByRole('button', { name: /Eisenhower Matrix/ })).toBeInTheDocument()

      fireEvent.keyDown(screen.getByRole('searchbox', { name: /filter templates/i }), { key: 'Escape' })
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('button', { name: /Eisenhower Matrix/ })).not.toBeInTheDocument()
      // The nested dialog consumed the Escape — the builder modal stays open.
      expect(onCancel).not.toHaveBeenCalled()
      expect(screen.getByRole('dialog', { name: 'Create Framework' })).toBeInTheDocument()
    })

    it('declares the popup type that actually opens (A11Y-016)', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderModal {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /choose a template/i })
      await user.click(trigger)

      const panel = screen.getByRole('dialog', { name: /choose a template/i })
      expect(trigger.getAttribute('aria-haspopup')).toBe(panel.getAttribute('role'))
    })

    it('restores focus to the trigger when dismissed by clicking outside (A11Y-016)', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderModal {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /choose a template/i })
      await user.click(trigger)
      expect(screen.getByRole('dialog', { name: /choose a template/i })).toBeInTheDocument()

      // The dismissal mechanism is the outside mousedown; focus must land on
      // the trigger rather than being stranded in the unmounted dialog. (A
      // real pointer press may subsequently move focus to its own target —
      // that browser default is fine and out of scope here.)
      fireEvent.mouseDown(screen.getByRole('heading', { name: /create framework/i }))
      expect(screen.queryByRole('dialog', { name: /choose a template/i })).not.toBeInTheDocument()
      expect(trigger).toHaveFocus()
    })

    it('restores focus to the trigger when dismissed via Escape (A11Y-016)', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderModal {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /choose a template/i })
      await user.click(trigger)
      fireEvent.keyDown(screen.getByRole('searchbox', { name: /filter templates/i }), { key: 'Escape' })
      expect(trigger).toHaveFocus()
    })

    it('selecting a template from the dropdown closes it and fills the detail', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderModal {...defaultProps} />)

      const trigger = screen.getByRole('button', { name: /choose a template/i })
      await user.click(trigger)
      await user.click(screen.getByRole('button', { name: /Eisenhower Matrix/ }))

      // Dropdown closed (filter input gone), detail filled.
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByRole('searchbox', { name: /filter templates/i })).not.toBeInTheDocument()
      expect(screen.getByDisplayValue('Eisenhower Matrix')).toBeInTheDocument()
    })
  })

  describe('y-axis reads as a vertical axis beside the grid (DSGN-001)', () => {
    function axisRow() {
      const quadrant = screen.getByRole('textbox', { name: /quadrant 1 label/i })
      const grid = quadrant.parentElement
      if (!grid?.parentElement) throw new Error('quadrant grid row not found')
      return grid.parentElement
    }

    it('puts the Y axis input beside the quadrant grid and leaves the X axis below', () => {
      render(<FrameworkBuilderModal {...defaultProps} />)
      const row = axisRow()

      expect(row).toContainElement(screen.getByRole('textbox', { name: /y axis label/i }))
      expect(row).not.toContainElement(screen.getByRole('textbox', { name: /x axis label/i }))
    })

    it('rotates the Y axis input so it reads bottom-to-top', () => {
      render(<FrameworkBuilderModal {...defaultProps} />)
      // The visual orientation is the whole point of the ticket, and it is
      // carried by the rotation utility — jsdom computes no layout.
      expect(screen.getByRole('textbox', { name: /y axis label/i })).toHaveClass('-rotate-90')
    })

    it('keeps the Y axis input editable in place', async () => {
      const user = userEvent.setup()
      const onCreate = vi.fn()
      render(<FrameworkBuilderModal {...defaultProps} onCreate={onCreate} />)

      await user.type(screen.getByRole('textbox', { name: /framework name/i }), 'Mine')
      await user.type(screen.getByRole('textbox', { name: /y axis label/i }), 'Importance')
      for (const i of [1, 2, 3, 4]) {
        await user.type(screen.getByRole('textbox', { name: new RegExp(`quadrant ${i} label`, 'i') }), `Q${i}`)
      }
      await user.click(screen.getByRole('button', { name: 'Create Framework' }))

      expect(onCreate.mock.calls[0][0].axisY).toBe('Importance')
    })

    it('tabs through the axes in reading order: Y, quadrants, then X', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderModal {...defaultProps} />)

      screen.getByRole('textbox', { name: /y axis label/i }).focus()
      await user.tab()
      expect(screen.getByRole('textbox', { name: /quadrant 1 label/i })).toHaveFocus()

      // Past the remaining three quadrant labels.
      await user.tab()
      await user.tab()
      await user.tab()
      await user.tab()
      expect(screen.getByRole('textbox', { name: /x axis label/i })).toHaveFocus()
    })
  })

  describe('arrow-key navigation through the template list (IMPRV-005)', () => {
    // Entries share a container with "Blank / Custom"; category groups nest
    // inside it, so DOM order here is the order on screen. Scoped to the
    // filter input's list so the mobile trigger — whose label also carries
    // the selected entry's name — stays out of it.
    function entries() {
      const list = screen.getByRole('searchbox', { name: /filter templates/i }).parentElement
      if (!list) throw new Error('template list not found')
      const custom = within(list).getByRole('button', { name: /blank \/ custom/i })
      return within(custom.parentElement as HTMLElement).getAllByRole('button')
    }

    it('moves to the next and previous entry with ArrowDown and ArrowUp', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderModal {...defaultProps} />)
      const [first, second] = entries()

      first.focus()
      await user.keyboard('{ArrowDown}')
      expect(second).toHaveFocus()

      await user.keyboard('{ArrowUp}')
      expect(first).toHaveFocus()
    })

    it('crosses category group boundaries', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderModal {...defaultProps} />)
      const all = entries()
      // First pair split across two category groups. Index 0 is the ungrouped
      // "Blank / Custom" entry, so a boundary there is not a category change.
      const boundary = all.findIndex((el, i) => i > 1 && el.parentElement !== all[i - 1].parentElement)
      expect(boundary).toBeGreaterThan(1)

      all[boundary - 1].focus()
      await user.keyboard('{ArrowDown}')
      expect(all[boundary]).toHaveFocus()
    })

    it('wraps around at both ends of the list', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderModal {...defaultProps} />)
      const all = entries()
      const last = all[all.length - 1]

      all[0].focus()
      await user.keyboard('{ArrowUp}')
      expect(last).toHaveFocus()

      await user.keyboard('{ArrowDown}')
      expect(all[0]).toHaveFocus()
    })

    it('enters the list from the filter input', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderModal {...defaultProps} />)
      const all = entries()

      screen.getByRole('searchbox', { name: /filter templates/i }).focus()
      await user.keyboard('{ArrowDown}')
      expect(all[0]).toHaveFocus()
    })

    it('traverses only the entries left by the filter', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderModal {...defaultProps} />)

      await user.type(screen.getByRole('searchbox', { name: /filter templates/i }), 'eisenhower')
      const filtered = entries()
      expect(filtered.length).toBeLessThan(5)

      filtered[0].focus()
      await user.keyboard('{ArrowUp}')
      expect(filtered[filtered.length - 1]).toHaveFocus()
    })

    it('leaves the form untouched until the focused entry is activated', async () => {
      const user = userEvent.setup()
      render(<FrameworkBuilderModal {...defaultProps} />)
      const nameField = screen.getByRole('textbox', { name: /framework name/i })
      await user.type(nameField, 'My own name')

      const [first, second] = entries()
      first.focus()
      await user.keyboard('{ArrowDown}')
      expect(second).toHaveFocus()
      // Arrowing past a template must not overwrite what the user typed.
      expect(nameField).toHaveValue('My own name')

      await user.keyboard('{Enter}')
      expect(nameField).toHaveValue('Eisenhower Matrix')
    })

    it('navigates inside the mobile picker dialog', async () => {
      const user = userEvent.setup()
      vi.mocked(useIsMobile).mockReturnValue(true)
      render(<FrameworkBuilderModal {...defaultProps} />)
      await user.click(screen.getByRole('button', { name: /choose a template/i }))

      // The dialog opens with the filter input focused.
      const all = entries()
      await user.keyboard('{ArrowDown}{ArrowDown}')
      expect(all[1]).toHaveFocus()
    })
  })
})
