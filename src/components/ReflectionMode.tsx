import { useState, useRef, useCallback } from 'react'
import { createItem } from '../storage'
import { deriveColors, defaultColors } from '../colors'
import { XIcon } from './Icons'
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

  const handleAdd = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (!text.trim()) return
      const updated = { ...framework }
      updated.quadrants = updated.quadrants.map((q, i) =>
        i === activeQuadrant
          ? { ...q, items: [...q.items, createItem(text.trim())] }
          : q,
      )
      onUpdate(updated)
      setText('')
      inputRef.current?.focus()
    },
    [text, activeQuadrant, framework, onUpdate],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      setActiveQuadrant((prev) => (prev + 1) % 4)
    }
    if (e.key === 'Escape') onExit()
  }

  const quadrant = framework.quadrants[activeQuadrant]

  return (
    <div
      className="fixed inset-0 bg-bg z-[1000] flex items-center justify-center"
      onKeyDown={handleKeyDown}
    >
      <button
        className="fixed top-5 right-5 p-2 rounded-lg text-text-secondary transition-all duration-150 hover:text-text hover:bg-border"
        onClick={onExit}
      >
        <XIcon size={20} />
      </button>

      <div className="w-full max-w-[600px] p-6">
        <div className="flex gap-1 mb-6">
          {framework.quadrants.map((q, i) => (
            <button
              key={i}
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
              onClick={() => {
                setActiveQuadrant(i)
                inputRef.current?.focus()
              }}
            >
              {q.label}
              <span className="text-[11px] text-text-tertiary bg-black/6 dark:bg-white/10 px-1.5 rounded-full">
                {q.items.length}
              </span>
            </button>
          ))}
        </div>

        <div
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
              className="w-full py-3.5 px-4 border border-black/10 dark:border-white/10 rounded-lg text-base bg-white/70 dark:bg-white/10 outline-none transition-all duration-150 focus:border-accent focus:bg-white dark:focus:bg-white/15 focus:ring-[3px] focus:ring-accent/10 text-text"
              autoFocus
            />
            <span className="block mt-2 text-xs text-text-tertiary text-center">
              Enter to add &middot; Tab to switch quadrant &middot; Esc to exit
            </span>
          </form>

          <div className="flex-1 flex flex-col gap-1.5">
            {quadrant.items.map((item) => (
              <div
                key={item.id}
                className="py-2.5 px-3.5 bg-white/60 dark:bg-white/10 rounded-lg text-sm"
              >
                {item.text}
              </div>
            ))}
            {quadrant.items.length === 0 && (
              <div className="text-text-tertiary text-sm text-center py-8">
                No items yet. Start typing above.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
