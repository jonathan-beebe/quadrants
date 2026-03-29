import { useState } from 'react'
import { templates } from '../templates'
import { deriveColors, defaultColors } from '../colors'
import PageTitle from './atoms/PageTitle'
import SectionLabel from './atoms/SectionLabel'
import Caption from './atoms/Caption'
import Button from './atoms/Button'
import type { Framework, FrameworkTemplate } from '../types'

interface FrameworkBuilderProps {
  editing: Framework | null
  onCreate: (template: FrameworkTemplate) => void
  onCancel: () => void
}

export default function FrameworkBuilder({ editing, onCreate, onCancel }: FrameworkBuilderProps) {
  const [name, setName] = useState(editing?.name || '')
  const [axisX, setAxisX] = useState(editing?.axisX || '')
  const [axisY, setAxisY] = useState(editing?.axisY || '')
  const [quadrants, setQuadrants] = useState(editing ? editing.quadrants.map((q) => q.label) : ['', '', '', ''])

  const isValid = name.trim() && quadrants.every((q) => q.trim())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    onCreate({
      name: name.trim(),
      axisX: axisX.trim(),
      axisY: axisY.trim(),
      quadrants: quadrants.map((q) => q.trim()),
    })
  }

  const applyTemplate = (t: FrameworkTemplate) => {
    setName(t.name)
    setAxisX(t.axisX)
    setAxisY(t.axisY)
    setQuadrants([...t.quadrants])
  }

  const setQuadrant = (i: number, value: string) => {
    setQuadrants((prev) => prev.map((q, idx) => (idx === i ? value : q)))
  }

  return (
    <div className="flex justify-center px-6 py-10 min-h-screen">
      <div className="w-full max-w-[640px]">
        <div className="flex items-center justify-between mb-8">
          <PageTitle as="h2">{editing ? 'Edit Framework' : 'Create Framework'}</PageTitle>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>

        {!editing && (
          <div className="mb-8">
            <SectionLabel>Start from a template</SectionLabel>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.name}
                  className="flex flex-col items-start p-3 px-4 bg-surface border border-border rounded-lg text-left transition-all duration-150 hover:border-accent hover:bg-accent-light"
                  aria-label={`Apply template: ${t.name}`}
                  onClick={() => applyTemplate(t)}>
                  <span className="text-[13px] font-medium">{t.name}</span>
                  <Caption className="mt-0.5">{t.quadrants.join(' / ')}</Caption>
                </button>
              ))}
            </div>
          </div>
        )}

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div>
            <SectionLabel>{editing ? 'Framework' : 'Or build your own'}</SectionLabel>
            <label className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-text-secondary">Framework Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Reflection Framework"
                autoFocus
                className="px-3 py-2.5 border border-border rounded-lg text-sm outline-none transition-[border-color] duration-150 focus:border-accent bg-surface text-text"
              />
            </label>
          </div>

          <div>
            <SectionLabel>Quadrant Labels</SectionLabel>
            <div className="flex flex-col items-center gap-2">
              <div className="w-full text-center">
                <input
                  type="text"
                  value={axisY}
                  onChange={(e) => setAxisY(e.target.value)}
                  placeholder="Y axis (optional)"
                  aria-label="Y axis label (optional)"
                  className="px-3 py-1.5 border border-dashed border-border rounded-lg text-xs text-center text-text-secondary outline-none w-[180px] transition-[border-color] duration-150 focus:border-accent bg-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 w-full">
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
                      background: deriveColors(defaultColors[i]).bg,
                      borderColor: deriveColors(defaultColors[i]).border,
                    }}
                  />
                ))}
              </div>
              <div className="w-full text-center">
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
              {editing ? 'Save Changes' : 'Create Framework'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
