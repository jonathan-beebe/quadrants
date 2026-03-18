import { useRef, useCallback, useEffect, useState } from 'react'
import { XIcon } from './Icons'
import type { Item } from '../types'

const DRAG_THRESHOLD = 4
export const PLACEHOLDER = 'New item...'

export interface DragStartInfo {
  pageX: number
  pageY: number
  grabX: number
  grabY: number
  width: number
  height: number
}

export interface MoveTarget {
  label: string
  index: number
}

interface CardProps {
  item: Item
  isDragging: boolean
  autoFocus: boolean
  moveTargets: MoveTarget[]
  onChange: (text: string) => void
  onDelete: () => void
  onMove: (targetIdx: number) => void
  onDragStart: (info: DragStartInfo) => void
}

export default function Card({
  item,
  isDragging,
  autoFocus,
  moveTargets,
  onChange,
  onDelete,
  onMove,
  onDragStart,
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const spanRef = useRef<HTMLSpanElement>(null)
  const pendingRef = useRef<{ startX: number; startY: number } | null>(null)
  const moveMenuRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState(autoFocus)
  const [editValue, setEditValue] = useState(item.text)
  const [minSize, setMinSize] = useState<{ width: number; height: number } | null>(null)
  const [showMoveMenu, setShowMoveMenu] = useState(false)

  // Close move menu on outside click
  useEffect(() => {
    if (!showMoveMenu) return
    const handleClick = (e: MouseEvent) => {
      if (moveMenuRef.current && !moveMenuRef.current.contains(e.target as Node)) {
        setShowMoveMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showMoveMenu])

  // Focus first menu item when move menu opens
  useEffect(() => {
    if (showMoveMenu && moveMenuRef.current) {
      const first = moveMenuRef.current.querySelector<HTMLElement>('[role="menuitem"]')
      first?.focus()
    }
  }, [showMoveMenu])

  const handleMoveMenuKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const items = moveMenuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')
      if (!items?.length) return
      const currentIdx = Array.from(items).indexOf(e.target as HTMLElement)

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        items[(currentIdx + 1) % items.length].focus()
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        items[(currentIdx - 1 + items.length) % items.length].focus()
      } else if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault()
        setShowMoveMenu(false)
        spanRef.current?.focus()
      }
    },
    [],
  )

  const resizeTextarea = useCallback(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = '0'
    ta.style.height = `${ta.scrollHeight}px`
  }, [])

  useEffect(() => {
    if (!editing) return
    const ta = textareaRef.current
    if (!ta) return
    resizeTextarea()
    ta.focus()
    ta.select()
  }, [editing, resizeTextarea])

  useEffect(() => {
    return () => {
      window.removeEventListener('pointermove', handlePendingMove)
      window.removeEventListener('pointerup', handlePendingUp)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const fireDragStart = useCallback(
    (pageX: number, pageY: number) => {
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
    },
    [onDragStart],
  )

  const handlePendingMove = useCallback(
    (e: PointerEvent) => {
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
    },
    [fireDragStart], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const handlePendingUp = useCallback(() => {
    window.removeEventListener('pointermove', handlePendingMove)
    window.removeEventListener('pointerup', handlePendingUp)
    if (!pendingRef.current) return
    pendingRef.current = null
    enterEditMode()
  }, [handlePendingMove]) // eslint-disable-line react-hooks/exhaustive-deps

  const enterEditMode = useCallback(() => {
    const span = spanRef.current
    if (span) {
      setMinSize({ width: span.offsetWidth, height: span.offsetHeight })
    }
    setEditValue(item.text)
    setEditing(true)
  }, [item.text])

  const commitEdit = useCallback(
    (value: string) => {
      setEditing(false)
      setMinSize(null)
      const trimmed = value.trim()
      if (!trimmed || trimmed === PLACEHOLDER) {
        onDelete()
        return
      }
      if (trimmed !== item.text) onChange(trimmed)
    },
    [item.text, onChange, onDelete],
  )

  const handleTextPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      if (editing) {
        e.stopPropagation()
        return
      }
      e.preventDefault()
      e.stopPropagation()
      pendingRef.current = { startX: e.pageX, startY: e.pageY }
      window.addEventListener('pointermove', handlePendingMove)
      window.addEventListener('pointerup', handlePendingUp)
    },
    [editing, handlePendingMove, handlePendingUp],
  )

  const handleDisplayKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        enterEditMode()
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        if (moveTargets.length > 0) setShowMoveMenu(true)
      }
    },
    [enterEditMode, moveTargets],
  )

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        commitEdit(editValue)
      }
      if (e.key === 'Escape') {
        setEditing(false)
        setMinSize(null)
      }
    },
    [editValue, commitEdit],
  )

  const handleBlur = useCallback(() => {
    commitEdit(editValue)
  }, [editValue, commitEdit])

  const textClasses = 'flex-1 min-w-0 break-words outline-none rounded-sm'

  return (
    <div
      ref={cardRef}
      className={`absolute w-max max-w-[180px] min-w-[60px] py-[7px] px-2.5 bg-white/85 dark:bg-white/10 border border-black/8 dark:border-white/10 rounded-lg shadow-sm text-[13px] leading-[1.4] flex items-start gap-1 transition-[box-shadow,opacity] duration-150 touch-none ${editing ? 'cursor-text' : 'cursor-grab'} ${isDragging ? 'opacity-30 pointer-events-none' : ''} hover:shadow hover:bg-white/95 dark:hover:bg-white/15`}
      style={{ left: `${item.x ?? 10}%`, top: `${item.y ?? 10}%` }}
      onPointerDown={(e) => {
        if (e.button !== 0 || editing) return
        e.preventDefault()
        fireDragStart(e.pageX, e.pageY)
      }}
    >
      {editing ? (
        <textarea
          ref={textareaRef}
          className={`${textClasses} resize-none bg-transparent p-0 m-0 border-none text-[13px] leading-[1.4] font-[inherit] cursor-text`}
          style={minSize ? { minWidth: minSize.width, minHeight: minSize.height } : undefined}
          value={editValue}
          aria-label={`Edit item: ${item.text}`}
          rows={1}
          spellCheck={false}
          onChange={(e) => {
            setEditValue(e.target.value)
            resizeTextarea()
          }}
          onBlur={handleBlur}
          onKeyDown={handleTextareaKeyDown}
          onPointerDown={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          ref={spanRef}
          className={`${textClasses} ${editing ? 'cursor-text' : 'cursor-grab'}`}
          role="button"
          tabIndex={0}
          aria-label={`Edit item: ${item.text}`}
          onPointerDown={handleTextPointerDown}
          onKeyDown={handleDisplayKeyDown}
        >
          {item.text}
        </span>
      )}
      <button
        className="p-0 rounded-sm text-text-tertiary transition-all duration-150 cursor-pointer opacity-0 shrink-0 mt-px hover:text-danger hover:bg-red-500/10 focus:opacity-100 [div:hover>&]:opacity-100 [div:focus-within>&]:opacity-100"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onDelete}
        aria-label={`Delete item: ${item.text}`}
        title="Delete"
      >
        <XIcon size={11} aria-hidden="true" />
      </button>
      {showMoveMenu && moveTargets.length > 0 && (
        <div
          ref={moveMenuRef}
          role="menu"
          aria-label={`Move "${item.text}" to quadrant`}
          className="absolute left-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg z-[200] min-w-[140px] p-1"
          onKeyDown={handleMoveMenuKeyDown}
        >
          {moveTargets.map((target) => (
            <button
              key={target.index}
              role="menuitem"
              className="block w-full text-left px-3 py-2 text-[13px] rounded text-text hover:bg-bg"
              onClick={(e) => {
                e.stopPropagation()
                onMove(target.index)
                setShowMoveMenu(false)
              }}
            >
              Move to {target.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export interface DragState {
  itemId: string
  sourceIdx: number
  grabX: number
  grabY: number
  width: number
  height: number
  x: number
  y: number
}

interface GhostCardProps {
  drag: DragState
  text: string
}

export function GhostCard({ drag, text }: GhostCardProps) {
  return (
    <div
      className="absolute w-max max-w-[180px] min-w-[60px] py-[7px] px-2.5 bg-white dark:bg-gray-700 border border-black/8 dark:border-white/10 rounded-lg shadow-lg text-[13px] leading-[1.4] flex items-start gap-1 cursor-grabbing opacity-92"
      style={{
        left: drag.x - drag.grabX,
        top: drag.y - drag.grabY,
        width: drag.width,
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    >
      <span className="flex-1 min-w-0 break-words">{text}</span>
    </div>
  )
}
