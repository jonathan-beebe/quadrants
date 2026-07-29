import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { templates } from '../templates'
import { deriveColors, defaultColors } from '../colors'
import { useIsMobile } from '../hooks/useIsMobile'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { useClickOutside } from '../hooks/useClickOutside'
import { useListArrowNav } from '../hooks/useListArrowNav'
import SectionLabel from './atoms/SectionLabel'
import Caption from './atoms/Caption'
import Button from './atoms/Button'
import { TEMPLATE_CATEGORIES } from '../types'
import type { Framework, FrameworkTemplate } from '../types'

interface FrameworkBuilderContentProps {
  editingFramework: Framework | null
  onCreate: (template: FrameworkTemplate) => void
  onCancel: () => void
}

const CUSTOM_KEY = '__custom__'

/**
 * The framework-authoring UI — template picker plus the name/axes/quadrant
 * form — free of any screen chrome, so a host (the builder screen, a modal)
 * decides where and how it is presented (IMPRV-008).
 */
export default function FrameworkBuilderContent({
  editingFramework,
  onCreate,
  onCancel,
}: FrameworkBuilderContentProps) {
  const isMobile = useIsMobile()
  const [name, setName] = useState(editingFramework?.name || '')
  const [axisX, setAxisX] = useState(editingFramework?.axisX || '')
  const [axisY, setAxisY] = useState(editingFramework?.axisY || '')
  const [quadrants, setQuadrants] = useState(
    editingFramework ? editingFramework.quadrants.map((q) => q.label) : ['', '', '', ''],
  )
  const [colors, setColors] = useState<string[]>(
    editingFramework ? editingFramework.quadrants.map((q) => q.color) : defaultColors,
  )
  const [selected, setSelected] = useState<string>(CUSTOM_KEY)
  const [query, setQuery] = useState('')
  const [listOpen, setListOpen] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const entriesRef = useRef<HTMLDivElement>(null)

  const isValid = name.trim() && quadrants.every((q) => q.trim())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    onCreate({
      name: name.trim(),
      axisX: axisX.trim(),
      axisY: axisY.trim(),
      quadrants: quadrants.map((q) => q.trim()),
      colors,
    })
  }

  const applyTemplate = (t: FrameworkTemplate) => {
    setName(t.name)
    setAxisX(t.axisX)
    setAxisY(t.axisY)
    setQuadrants([...t.quadrants])
    setColors(t.colors ?? defaultColors)
    setSelected(t.name)
  }

  const applyCustom = () => {
    setName('')
    setAxisX('')
    setAxisY('')
    setQuadrants(['', '', '', ''])
    setColors(defaultColors)
    setSelected(CUSTOM_KEY)
  }

  const setQuadrant = (i: number, value: string) => {
    setQuadrants((prev) => prev.map((q, idx) => (idx === i ? value : q)))
  }

  const closeList = useCallback(() => {
    setListOpen(false)
    triggerRef.current?.focus()
  }, [])

  // triggerRef is excluded so the trigger's own onClick toggle can close the
  // dropdown instead of racing the mousedown-close (BUG-005). Dismissal
  // routes through closeList so focus returns to the trigger on every path,
  // matching Escape (A11Y-016).
  useClickOutside(panelRef, closeList, listOpen, triggerRef)
  const handlePanelKeyDown = useFocusTrap(panelRef, closeList)
  const handleEntriesKeyDown = useListArrowNav(entriesRef)

  useEffect(() => {
    if (listOpen) searchRef.current?.focus()
  }, [listOpen])

  const pickTemplate = (t: FrameworkTemplate) => {
    applyTemplate(t)
    if (isMobile) closeList()
  }

  const pickCustom = () => {
    applyCustom()
    if (isMobile) closeList()
  }

  const q = query.trim().toLowerCase()
  const groups = useMemo(() => {
    const matches = templates.filter(
      (t) => !q || t.name.toLowerCase().includes(q) || (t.description ?? '').toLowerCase().includes(q),
    )
    return TEMPLATE_CATEGORIES.map((cat) => ({
      cat,
      items: matches.filter((t) => t.category === cat),
    })).filter((g) => g.items.length > 0)
  }, [q])

  const selectedLabel = selected === CUSTOM_KEY ? 'Blank / Custom' : selected
  const selectedTemplate = selected === CUSTOM_KEY ? null : (templates.find((t) => t.name === selected) ?? null)

  const list = (
    <div className="flex flex-col gap-2 min-h-0 flex-1" onKeyDown={handleEntriesKeyDown}>
      <input
        ref={searchRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Filter templates…"
        aria-label="Filter templates"
        className="px-3 py-2 border border-border rounded-lg text-sm outline-none transition-[border-color] duration-150 focus:border-accent bg-surface text-text"
      />
      <div ref={entriesRef} className="flex flex-col gap-3 overflow-y-auto min-h-0 flex-1 pr-1">
        <button
          type="button"
          aria-current={selected === CUSTOM_KEY ? 'true' : undefined}
          onClick={pickCustom}
          className={`flex flex-col items-start p-2.5 px-3 border rounded-lg text-left transition-all duration-150 hover:border-accent hover:bg-accent-light ${
            selected === CUSTOM_KEY ? 'border-accent bg-accent-light' : 'border-border bg-surface'
          }`}>
          <span className="text-[13px] font-medium">Blank / Custom</span>
          <Caption className="mt-0.5">Start from scratch.</Caption>
        </button>

        {groups.map((g) => (
          <div key={g.cat} className="flex flex-col gap-1">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-text-tertiary px-1">{g.cat}</h4>
            {g.items.map((t) => (
              <button
                key={t.name}
                type="button"
                aria-current={selected === t.name ? 'true' : undefined}
                onClick={() => pickTemplate(t)}
                className={`flex flex-col items-start p-2.5 px-3 border rounded-lg text-left transition-all duration-150 hover:border-accent hover:bg-accent-light ${
                  selected === t.name ? 'border-accent bg-accent-light' : 'border-border bg-surface'
                }`}>
                <span className="text-[13px] font-medium">{t.name}</span>
                <Caption className="mt-0.5">{t.description ?? t.quadrants.join(' / ')}</Caption>
              </button>
            ))}
          </div>
        ))}

        {groups.length === 0 && (
          <p role="status" className="py-4 px-1 text-[13px] text-text-tertiary">
            No templates match “{query}”.
          </p>
        )}
      </div>
    </div>
  )

  const form = (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <div>
        {/* The builder teaches at the moment of choice (IMPRV-011): the chosen
            framework's name and its doc summary sit above Customize. The live
            region stays mounted so screen readers announce each selection. */}
        {!editingFramework && (
          <div aria-live="polite">
            {selectedTemplate && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-text">{selectedTemplate.name}</h3>
                <p className="mt-1 text-[13px] text-text-secondary">{selectedTemplate.summary}</p>
              </div>
            )}
          </div>
        )}
        <SectionLabel>{editingFramework ? 'Framework' : 'Customize'}</SectionLabel>
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-text-secondary">Framework Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., My Decision Matrix"
            autoFocus
            className="px-3 py-2.5 border border-border rounded-lg text-sm outline-none transition-[border-color] duration-150 focus:border-accent bg-surface text-text"
          />
        </label>
      </div>

      <div>
        <SectionLabel>Quadrant Labels</SectionLabel>
        <div className="flex flex-col items-center gap-2">
          <div className="flex w-full gap-2">
            {/* Y-axis rail, echoing the canvas (QuadrantGrid): the label runs
                bottom-to-top along the grid's left edge. The rail is a narrow
                stretched column and the input is taken out of flow, so its
                unrotated 132px box cannot widen the column. That width is the
                grid's height (two 62px rows plus the 8px gap), which makes the
                label span the axis it names. */}
            <div className="relative w-9 shrink-0">
              <input
                type="text"
                value={axisY}
                onChange={(e) => setAxisY(e.target.value)}
                placeholder="Y axis (optional)"
                aria-label="Y axis label (optional)"
                className="absolute top-1/2 left-1/2 w-[132px] -translate-x-1/2 -translate-y-1/2 -rotate-90 px-3 py-1.5 border border-dashed border-border rounded-lg text-xs text-center text-text-secondary outline-none transition-[border-color] duration-150 focus:border-accent bg-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 flex-1">
              {[0, 1, 2, 3].map((i) => (
                <input
                  key={i}
                  type="text"
                  value={quadrants[i]}
                  onChange={(e) => setQuadrant(i, e.target.value)}
                  placeholder={`Quadrant ${i + 1}`}
                  aria-label={`Quadrant ${i + 1} label`}
                  className="py-5 px-4 border rounded-lg text-sm font-medium text-center outline-none transition-all duration-150 focus:ring-2 focus:ring-accent"
                  style={{
                    background: deriveColors(colors[i]).bg,
                    borderColor: deriveColors(colors[i]).border,
                  }}
                />
              ))}
            </div>
          </div>
          {/* Offset by the rail plus the gap so the X axis centers under the
              grid rather than under the row. */}
          <div className="w-full text-center pl-11">
            <input
              type="text"
              value={axisX}
              onChange={(e) => setAxisX(e.target.value)}
              placeholder="X axis (optional)"
              aria-label="X axis label (optional)"
              className="px-3 py-1.5 border border-dashed border-border rounded-lg text-xs text-center text-text-secondary outline-none w-[180px] transition-[border-color] duration-150 focus:border-accent bg-transparent"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!isValid}>
          {editingFramework ? 'Save Changes' : 'Create Framework'}
        </Button>
      </div>
    </form>
  )

  return editingFramework ? (
    form
  ) : isMobile ? (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <SectionLabel>Start from a template</SectionLabel>
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={listOpen}
          aria-label={`Choose a template (current: ${selectedLabel})`}
          onClick={() => setListOpen((o) => !o)}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 border border-border rounded-lg text-sm bg-surface text-text text-left transition-[border-color] duration-150 hover:border-accent">
          <span className="truncate font-medium">{selectedLabel}</span>
          <span aria-hidden="true" className="text-text-tertiary">
            ▾
          </span>
        </button>
        {listOpen && (
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Choose a template"
            onKeyDown={handlePanelKeyDown}
            // 60svh, not 60vh: this popover is mobile-only, and a cap
            // measured against the large viewport lets it run past the
            // visible one (BUG-017).
            className="absolute left-0 right-0 top-full mt-1 z-[200] max-h-[60svh] flex flex-col p-2 bg-surface border border-border rounded-lg shadow-lg">
            {list}
          </div>
        )}
      </div>
      {form}
    </div>
  ) : (
    <div className="grid grid-cols-[280px_1fr] gap-8 items-start flex-1 min-h-0">
      <div className="flex flex-col min-h-0 self-stretch">
        <SectionLabel>Start from a template</SectionLabel>
        {list}
      </div>
      {form}
    </div>
  )
}
