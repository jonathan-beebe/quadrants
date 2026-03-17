import { useState } from 'react'
import { templates } from '../templates'
import './FrameworkBuilder.css'

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
    <div className="builder">
      <div className="builder__container">
        <div className="builder__header">
          <h2>{editing ? 'Edit Framework' : 'Create Framework'}</h2>
          <button className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        </div>

        {!editing && (
          <div className="builder__templates">
            <h3>Start from a template</h3>
            <div className="builder__template-grid">
              {templates.map((t) => (
                <button key={t.name} className="builder__template" onClick={() => applyTemplate(t)}>
                  <span className="builder__template-name">{t.name}</span>
                  <span className="builder__template-labels">
                    {t.quadrants.join(' / ')}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form className="builder__form" onSubmit={handleSubmit}>
          <div className="builder__section">
            <h3>{editing ? 'Framework' : 'Or build your own'}</h3>
            <label className="builder__field">
              <span>Framework Name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Reflection Framework"
                autoFocus
              />
            </label>
          </div>

          <div className="builder__section">
            <h3>Quadrant Labels</h3>
            <div className="builder__quadrant-preview">
              <div className="builder__axis-y">
                <input
                  type="text"
                  value={axisY}
                  onChange={(e) => setAxisY(e.target.value)}
                  placeholder="Y axis (optional)"
                  className="builder__axis-input"
                />
              </div>
              <div className="builder__grid-preview">
                {[0, 1, 2, 3].map((i) => (
                  <input
                    key={i}
                    type="text"
                    value={quadrants[i]}
                    onChange={(e) => setQuadrant(i, e.target.value)}
                    placeholder={`Quadrant ${i + 1}`}
                    className={`builder__quadrant-input builder__quadrant-input--${i}`}
                  />
                ))}
              </div>
              <div className="builder__axis-x">
                <input
                  type="text"
                  value={axisX}
                  onChange={(e) => setAxisX(e.target.value)}
                  placeholder="X axis (optional)"
                  className="builder__axis-input"
                />
              </div>
            </div>
          </div>

          <div className="builder__actions">
            <button className="btn btn--secondary" type="button" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn btn--primary" type="submit" disabled={!isValid}>
              {editing ? 'Save Changes' : 'Create Framework'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
