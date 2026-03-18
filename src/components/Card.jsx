import { useRef, useCallback, useEffect } from 'react'
import './Card.css'

const DRAG_THRESHOLD = 4

export default function Card({ item, isDragging, onChange, onDelete, onDragStart }) {
  const cardRef = useRef(null)
  const textRef = useRef(null)
  const pendingRef = useRef(null) // { startX, startY, pageX, pageY }

  // Clean up listeners on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePendingMove)
      window.removeEventListener('pointerup', handlePendingUp)
    }
  }, [])

  const fireDragStart = useCallback((pageX, pageY) => {
    const cardEl = cardRef.current
    if (!cardEl) return
    const cardRect = cardEl.getBoundingClientRect()
    onDragStart({
      pageX,
      pageY,
      grabX: pageX - cardRect.left,
      grabY: pageY - cardRect.top,
      width: cardRect.width,
      height: cardRect.height,
    })
  }, [onDragStart])

  const handlePendingMove = useCallback((e) => {
    const p = pendingRef.current
    if (!p) return
    const dx = e.pageX - p.startX
    const dy = e.pageY - p.startY
    if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
      window.removeEventListener('pointermove', handlePendingMove)
      window.removeEventListener('pointerup', handlePendingUp)
      pendingRef.current = null
      fireDragStart(p.startX, p.startY)
    }
  }, [fireDragStart])

  const handlePendingUp = useCallback(() => {
    window.removeEventListener('pointermove', handlePendingMove)
    window.removeEventListener('pointerup', handlePendingUp)
    if (!pendingRef.current) return
    pendingRef.current = null
    // It was a click — focus the text
    textRef.current?.focus()
  }, [handlePendingMove])

  const handleTextPointerDown = useCallback((e) => {
    if (e.button !== 0) return

    // If already focused (editing), let normal text selection work
    if (document.activeElement === textRef.current) return

    // Prevent default to stop immediate focus — we'll decide on move vs click
    e.preventDefault()
    e.stopPropagation()

    pendingRef.current = { startX: e.pageX, startY: e.pageY }
    window.addEventListener('pointermove', handlePendingMove)
    window.addEventListener('pointerup', handlePendingUp)
  }, [handlePendingMove, handlePendingUp])

  const handleBlur = useCallback(() => {
    const el = textRef.current
    if (!el) return
    const newText = el.textContent.trim()
    if (newText && newText !== item.text) {
      onChange(newText)
    } else if (!newText) {
      el.textContent = item.text
    }
  }, [item.text, onChange])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      textRef.current?.blur()
    }
    if (e.key === 'Escape') {
      textRef.current.textContent = item.text
      textRef.current?.blur()
    }
  }, [item.text])

  return (
    <div
      ref={cardRef}
      className={`card ${isDragging ? 'card--dragging' : ''}`}
      style={{ left: `${item.x ?? 10}%`, top: `${item.y ?? 10}%` }}
      onPointerDown={(e) => {
        if (e.button !== 0) return
        e.preventDefault()
        fireDragStart(e.pageX, e.pageY)
      }}
    >
      <span
        ref={textRef}
        className="card__text"
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onPointerDown={handleTextPointerDown}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      >
        {item.text}
      </span>
      <button
        className="card__delete"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onDelete}
        title="Delete"
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

export function GhostCard({ drag, text }) {
  return (
    <div
      className="card card--ghost"
      style={{
        left: drag.x - drag.grabX,
        top: drag.y - drag.grabY,
        width: drag.width,
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <span className="card__text">{text}</span>
    </div>
  )
}
