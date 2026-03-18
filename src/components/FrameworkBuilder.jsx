import { useState } from 'react'
import { templates } from '../templates'
import { deriveColors, defaultColors } from '../colors'

export default function FrameworkBuilder({ editing, onCreate, onCancel }) {
  const [name, setName] = useState(editing?.name || '')
  const [axisX, setAxisX] = useState(editing?.axisX || '')
  const [axisY, setAxisY] = useState(editing?.axisY || '')
  const [quadrants, setQuadrants] = useState(
    editing ? editing.quadrants.map((q) => q.label) : ['', '', '', '']
  )

  const isValid = name.trim() && quadrants.every((q) => q.trim())

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return
    onCreate({ name: name.trim(), axisX: axisX.trim(), axisY: axisY.trim(), quadrants: quadrants.map((q) => q.trim()) })
  }

  const applyTemplate = (t) => {
    setName(t.name)
    setAxisX(t.axisX)
    setAxisY(t.axisY)
    setQuadrants([...t.quadrants])
  }

  const setQuadrant = (i, value) => {
    setQuadrants((prev) => prev.map((q, idx) => (idx === i ? value : q)))
  }

  return (
    <div className="flex justify-center px-6 py-10 min-h-screen">
      <div className="w-full max-w-[640px]">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-semibold">{editing ? 'Edit Framework' : 'Create Framework'}</h2>
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
        </div>

        {!editing && (
          <div className="mb-8">
            <h3 className="text-sm font-medium text-text-secondary mb-3">Start from a template</h3>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((t) => (
                <button
                  key={t.name}
                  className="flex flex-col items-start p-3 px-4 bg-surface border border-border rounded-lg text-left transition-all duration-150 hover:border-accent hover:bg-accent-light"
                  onClick={() => applyTemplate(t)}
                >
                  <span className="text-[13px] font-medium">{t.name}</span>
                  <span className="text-xs text-text-tertiary mt-0.5">{t.quadrants.join(' / ')}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
          <div>
            <h3 className="text-sm font-medium text-text-secondary mb-3">{editing ? 'Framework' : 'Or build your own'}</h3>
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
            <h3 className="text-sm font-medium text-text-secondary mb-3">Quadrant Labels</h3>
            <div className="flex flex-col items-center gap-2">
              <div className="w-full text-center">
                <input
                  type="text"
                  value={axisY}
                  onChange={(e) => setAxisY(e.target.value)}
                  placeholder="Y axis (optional)"
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
                  className="px-3 py-1.5 border border-dashed border-border rounded-lg text-xs text-center text-text-secondary outline-none w-[180px] transition-[border-color] duration-150 focus:border-accent bg-transparent"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button className="btn-secondary" type="button" onClick={onCancel}>Cancel</button>
            <button className="btn-primary" type="submit" disabled={!isValid}>
              {editing ? 'Save Changes' : 'Create Framework'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
