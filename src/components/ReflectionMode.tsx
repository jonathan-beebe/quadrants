import { useState, useRef, useCallback, useEffect } from 'react'
import { createItem } from '../storage'
import { addItem } from '../logic/items'
import { deriveColors, defaultColors } from '../colors'
import { XIcon } from './Icons'
import { useFocusTrap } from '../hooks/useFocusTrap'
import Badge from './atoms/Badge'
import Caption from './atoms/Caption'
import type { Framework } from '../types'

interface ReflectionModeProps {
  framework: Framework
  onUpdate: (framework: Framework) => void
  onExit: () => void
}

export default function ReflectionMode({
  framework,
  onUpdate,
  onExit,
}: ReflectionModeProps) {
  const [activeQuadrant, setActiveQuadrant] = useState(0)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Save previous focus and restore on exit
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement
    return () => {
      previousFocusRef.current?.focus()
    }
  }, [])

  const handleAdd = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!text.trim()) return
      const updated = addItem(framework, activeQuadrant, createItem(text.trim()))
      onUpdate(updated)
      setText('')
      inputRef.current?.focus()
    },
    [text, activeQuadrant, framework, onUpdate],
  )

  const handleKeyDown = useFocusTrap(overlayRef, onExit)

  const switchQuadrant = useCallback(
    (idx: number) => {
      setActiveQuadrant(idx)
      inputRef.current?.focus()
    },
    [],
  )

  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent, idx: number) => {
      const count = framework.quadrants.length
      let nextIdx: number | null = null

      if (e.key === 'ArrowRight') {
        nextIdx = (idx + 1) % count
      } else if (e.key === 'ArrowLeft') {
        nextIdx = (idx - 1 + count) % count
      } else if (e.key === 'Home') {
        nextIdx = 0
      } else if (e.key === 'End') {
        nextIdx = count - 1
      }

      if (nextIdx !== null) {
        e.preventDefault()
        switchQuadrant(nextIdx)
        // Focus the newly active tab after render
        const tabEl = document.getElementById(`quadrant-tab-${nextIdx}`)
        tabEl?.focus()
      }
    },
    [framework.quadrants.length, switchQuadrant],
  )

  const quadrant = framework.quadrants[activeQuadrant]

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-bg z-[1000] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Reflection mode: ${framework.name}`}
      onKeyDown={handleKeyDown}
    >
      <button
        className="fixed top-5 right-5 p-2 rounded-lg text-text-secondary transition-all duration-150 hover:text-text hover:bg-border"
        onClick={onExit}
        aria-label="Exit reflection mode"
      >
        <XIcon size={20} />
      </button>

      <div className="w-full max-w-[600px] p-6">
        <div className="flex gap-1 mb-6" role="tablist" aria-label="Quadrants">
          {framework.quadrants.map((q, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === activeQuadrant}
              aria-controls={`quadrant-panel-${i}`}
              id={`quadrant-tab-${i}`}
              tabIndex={i === activeQuadrant ? 0 : -1}
              aria-keyshortcuts="ArrowLeft ArrowRight Home End"
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-[13px] font-medium transition-all duration-150 border ${i === activeQuadrant ? 'text-text border-current' : 'text-text-secondary border-transparent hover:bg-surface hover:text-text'}`}
              style={
                i === activeQuadrant
                  ? {
                      background: deriveColors(q.color || defaultColors[i]).bg,
                      borderColor: deriveColors(q.color || defaultColors[i])
                        .border,
                    }
                  : undefined
              }
              onClick={() => switchQuadrant(i)}
              onKeyDown={(e) => handleTabKeyDown(e, i)}
            >
              {q.label}
              <Badge count={q.items.length} aria-hidden={true} />
            </button>
          ))}
        </div>

        <div
          id={`quadrant-panel-${activeQuadrant}`}
          role="tabpanel"
          aria-labelledby={`quadrant-tab-${activeQuadrant}`}
          className="p-6 rounded-xl border min-h-[400px] flex flex-col"
          style={{
            background: deriveColors(
              quadrant.color || defaultColors[activeQuadrant],
            ).bg,
            borderColor: deriveColors(
              quadrant.color || defaultColors[activeQuadrant],
            ).border,
          }}
        >
          <h2 className="text-2xl font-semibold mb-5">{quadrant.label}</h2>

          <form className="mb-5" onSubmit={handleAdd}>
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Add to "${quadrant.label}"...`}
              aria-label={`Add item to ${quadrant.label}`}
              className="w-full py-3.5 px-4 border border-black/10 dark:border-white/10 rounded-lg text-base bg-white/70 dark:bg-white/10 outline-none transition-all duration-150 focus:border-accent focus:bg-white dark:focus:bg-white/15 focus:ring-[3px] focus:ring-accent/10 text-text"
              autoFocus
            />
            <Caption className="block mt-2 text-center">
              Enter to add &middot; Esc to exit
            </Caption>
          </form>

          <ul className="flex-1 flex flex-col gap-1.5" aria-label={`Items in ${quadrant.label}`}>
            {quadrant.items.map((item) => (
              <li
                key={item.id}
                className="py-2.5 px-3.5 bg-white/60 dark:bg-white/10 rounded-lg text-sm"
              >
                {item.text}
              </li>
            ))}
            {quadrant.items.length === 0 && (
              <li className="text-text-tertiary text-sm text-center py-8">
                No items yet. Start typing above.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  )
}
