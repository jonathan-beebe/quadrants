import { useState, useRef, useCallback } from 'react'
import { createItem } from '../storage'
import './ReflectionMode.css'

export default function ReflectionMode({ framework, onUpdate, onExit }) {
  const [activeQuadrant, setActiveQuadrant] = useState(0)
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  const handleAdd = useCallback(
    (e) => {
      e.preventDefault()
      if (!text.trim()) return
      const updated = { ...framework }
      updated.quadrants = updated.quadrants.map((q, i) =>
        i === activeQuadrant ? { ...q, items: [...q.items, createItem(text.trim())] } : q
      )
      onUpdate(updated)
      setText('')
      inputRef.current?.focus()
    },
    [text, activeQuadrant, framework, onUpdate]
  )

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      setActiveQuadrant((prev) => (prev + 1) % 4)
    }
    if (e.key === 'Escape') {
      onExit()
    }
  }

  const quadrant = framework.quadrants[activeQuadrant]

  return (
    <div className="reflect" onKeyDown={handleKeyDown}>
      <button className="reflect__exit" onClick={onExit}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="reflect__content">
        <div className="reflect__tabs">
          {framework.quadrants.map((q, i) => (
            <button
              key={i}
              className={`reflect__tab reflect__tab--${i} ${i === activeQuadrant ? 'reflect__tab--active' : ''}`}
              onClick={() => {
                setActiveQuadrant(i)
                inputRef.current?.focus()
              }}
            >
              {q.label}
              <span className="reflect__tab-count">{q.items.length}</span>
            </button>
          ))}
        </div>

        <div className={`reflect__panel reflect__panel--${activeQuadrant}`}>
          <h2 className="reflect__label">{quadrant.label}</h2>

          <form className="reflect__form" onSubmit={handleAdd}>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Add to "${quadrant.label}"...`}
              className="reflect__input"
              autoFocus
            />
            <span className="reflect__hint">
              Enter to add &middot; Tab to switch quadrant &middot; Esc to exit
            </span>
          </form>

          <div className="reflect__items">
            {quadrant.items.map((item) => (
              <div key={item.id} className="reflect__item">
                {item.text}
              </div>
            ))}
            {quadrant.items.length === 0 && (
              <div className="reflect__empty">No items yet. Start typing above.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
