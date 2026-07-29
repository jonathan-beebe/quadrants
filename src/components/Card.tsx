import { useRef, useCallback, useEffect, useState } from 'react'
import { XIcon } from './Icons'
import PopupMenu, { popupMenuTriggerProps } from './PopupMenu'
import { clampPosition, clientToContainerPoint } from '../logic/items'
import type { Item, MoveTarget } from '../types'

const DRAG_THRESHOLD = 4
export const PLACEHOLDER = 'New item...'

export interface DragStartInfo {
  clientX: number
  clientY: number
  grabX: number
  grabY: number
  width: number
  height: number
}

interface CardProps {
  item: Item
  isDragging: boolean
  autoFocus: boolean
  moveTargets: MoveTarget[]
  onChange: (text: string) => void
  onDelete: () => void
  onMove: (targetIdx: number) => void
  onReposition: (x: number, y: number) => void
  onDragStart: (info: DragStartInfo) => void
  /**
   * When present, activating the card requests an external editing surface
   * (the edit modal) instead of the inline textarea. Receives the display
   * button so the modal can return focus to it (A11Y-022).
   */
  onRequestEdit?: (opener: HTMLElement) => void
}

// Keyboard reposition step sizes in percent of the canvas. Shift = larger jumps.
const REPOSITION_STEP = 5
const REPOSITION_STEP_LARGE = 15

export default function Card({
  item,
  isDragging,
  autoFocus,
  moveTargets,
  onChange,
  onDelete,
  onMove,
  onReposition,
  onDragStart,
  onRequestEdit,
}: CardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const displayButtonRef = useRef<HTMLButtonElement>(null)
  const pendingRef = useRef<{ startX: number; startY: number } | null>(null)
  const cancelledRef = useRef(false)
  const moveMenuId = `move-menu-${item.id}`
  const [editing, setEditing] = useState(autoFocus)
  const [editValue, setEditValue] = useState(item.text)
  const [minSize, setMinSize] = useState<{ width: number; height: number } | null>(null)
  const [showMoveMenu, setShowMoveMenu] = useState(false)

  // Stable identity: PopupMenu subscribes this through useClickOutside.
  const closeMoveMenu = useCallback(() => setShowMoveMenu(false), [])

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

  // Use refs for callbacks passed to window listeners to avoid stale closures
  const onDragStartRef = useRef(onDragStart)
  onDragStartRef.current = onDragStart
  const itemTextRef = useRef(item.text)
  itemTextRef.current = item.text
  const onDeleteRef = useRef(onDelete)
  onDeleteRef.current = onDelete
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const onRequestEditRef = useRef(onRequestEdit)
  onRequestEditRef.current = onRequestEdit

  const fireDragStart = useCallback((clientX: number, clientY: number) => {
    const cardEl = cardRef.current
    if (!cardEl) return
    const cardRect = cardEl.getBoundingClientRect()
    onDragStartRef.current({
      clientX,
      clientY,
      grabX: clientX - cardRect.left,
      grabY: clientY - cardRect.top,
      width: cardRect.width,
      height: cardRect.height,
    })
  }, [])

  const enterEditMode = useCallback(() => {
    const displayButton = displayButtonRef.current
    if (onRequestEditRef.current && displayButton) {
      onRequestEditRef.current(displayButton)
      return
    }
    if (displayButton) {
      setMinSize({ width: displayButton.offsetWidth, height: displayButton.offsetHeight })
    }
    setEditValue(itemTextRef.current)
    setEditing(true)
  }, [])

  const cleanupPending = useRef<(() => void) | null>(null)

  useEffect(() => {
    return () => cleanupPending.current?.()
  }, [])

  const startPendingDrag = useCallback(
    (startX: number, startY: number) => {
      pendingRef.current = { startX, startY }

      const onMove = (e: PointerEvent) => {
        const p = pendingRef.current
        if (!p) return
        const dx = e.clientX - p.startX
        const dy = e.clientY - p.startY
        if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
          cleanup()
          pendingRef.current = null
          fireDragStart(p.startX, p.startY)
        }
      }

      const onUp = () => {
        cleanup()
        if (!pendingRef.current) return
        pendingRef.current = null
        enterEditMode()
      }

      const cleanup = () => {
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        cleanupPending.current = null
      }

      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      cleanupPending.current = cleanup
    },
    [fireDragStart, enterEditMode],
  )

  const commitEdit = useCallback((value: string) => {
    setEditing(false)
    setMinSize(null)
    const trimmed = value.trim()
    if (!trimmed || trimmed === PLACEHOLDER) {
      onDeleteRef.current()
      return
    }
    if (trimmed !== itemTextRef.current) onChangeRef.current(trimmed)
  }, [])

  const handleTextPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      if (editing) {
        e.stopPropagation()
        return
      }
      e.preventDefault()
      e.stopPropagation()
      startPendingDrag(e.clientX, e.clientY)
    },
    [editing, startPendingDrag],
  )

  const handleDisplayKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        enterEditMode()
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault()
        if (moveTargets.length > 0) setShowMoveMenu(true)
      } else if (e.key.startsWith('Arrow')) {
        const step = e.shiftKey ? REPOSITION_STEP_LARGE : REPOSITION_STEP
        const currentX = item.x ?? 10
        const currentY = item.y ?? 10
        let nextX = currentX
        let nextY = currentY
        if (e.key === 'ArrowLeft') nextX = currentX - step
        else if (e.key === 'ArrowRight') nextX = currentX + step
        else if (e.key === 'ArrowUp') nextY = currentY - step
        else if (e.key === 'ArrowDown') nextY = currentY + step
        else return
        e.preventDefault()
        nextX = clampPosition(nextX)
        nextY = clampPosition(nextY)
        if (nextX !== currentX || nextY !== currentY) onReposition(nextX, nextY)
      }
    },
    [enterEditMode, moveTargets, item.x, item.y, onReposition],
  )

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        commitEdit(editValue)
      }
      if (e.key === 'Escape') {
        cancelledRef.current = true
        setEditing(false)
        setMinSize(null)
        // A fresh add is persisted with PLACEHOLDER text before any edit, so
        // cancelling must clean it up; re-editing an existing item keeps its
        // original text (BUG-004).
        if (itemTextRef.current === PLACEHOLDER) onDeleteRef.current()
      }
    },
    [editValue, commitEdit],
  )

  const handleBlur = useCallback(() => {
    if (cancelledRef.current) {
      cancelledRef.current = false
      return
    }
    commitEdit(editValue)
  }, [editValue, commitEdit])

  // No outline-none here: the global *:focus-visible rule (index.css) must
  // reach this button — it is the card's primary keyboard target and needs a
  // visible focus indicator (A11Y-014). Pointer clicks stay outline-free via
  // the :focus-visible heuristic.
  const textClasses = 'flex-1 min-w-0 break-words rounded-sm'

  return (
    <div
      ref={cardRef}
      className={`absolute w-max max-w-[180px] min-w-[60px] py-[7px] px-2.5 bg-white/85 dark:bg-white/10 border border-black/8 dark:border-white/10 rounded-lg shadow-sm text-[13px] leading-[1.4] flex items-start gap-1 transition-[box-shadow,opacity] duration-150 touch-none ${editing ? 'cursor-text' : 'cursor-grab'} ${isDragging ? 'opacity-30 pointer-events-none' : ''} hover:shadow hover:bg-white/95 dark:hover:bg-white/15`}
      style={{ left: `${item.x ?? 10}%`, top: `${item.y ?? 10}%` }}
      onPointerDown={(e) => {
        if (e.button !== 0 || editing) return
        e.preventDefault()
        startPendingDrag(e.clientX, e.clientY)
      }}>
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
        <button
          ref={displayButtonRef}
          type="button"
          className={`${textClasses} ${editing ? 'cursor-text' : 'cursor-grab'} bg-transparent border-none p-0 m-0 text-left text-inherit text-[inherit] leading-[inherit]`}
          aria-label={`Edit item: ${item.text}. Press M to move to another quadrant, or arrow keys to reposition.`}
          aria-keyshortcuts="m ArrowLeft ArrowRight ArrowUp ArrowDown"
          // Popup semantics only when M actually opens the menu — claiming
          // them with zero move targets would be false (A11Y-015). When the
          // edit modal is the primary activation, that dialog wins the claim,
          // so it overrides the menu's haspopup after the spread.
          {...(moveTargets.length > 0 ? popupMenuTriggerProps(moveMenuId, showMoveMenu) : {})}
          {...(onRequestEdit ? { 'aria-haspopup': 'dialog' as const } : {})}
          onPointerDown={handleTextPointerDown}
          onKeyDown={handleDisplayKeyDown}>
          {item.text}
        </button>
      )}
      {/* The delete affordance lives where editing lives (IMPRV-007): only
          the inline editor shows it, and modal-routed devices delete through
          the EditModal instead. preventDefault keeps focus in the textarea so
          the blur-commit can't flip `editing` off and unmount this button
          before its click lands. */}
      {editing && (
        <button
          className="absolute -top-2 -right-2 w-6 h-6 grid place-items-center rounded-full bg-white dark:bg-gray-700 border border-black/8 dark:border-white/10 shadow-sm text-text-tertiary transition-colors duration-150 cursor-pointer hover:text-danger hover:bg-red-500/10"
          onPointerDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={onDelete}
          aria-label={`Delete item: ${item.text}`}
          title="Delete">
          <XIcon size={11} />
        </button>
      )}
      {/* No triggerToggles: the display button opens this on M, never on
          click, so a press on it is an ordinary outside click (BUG-005). */}
      <PopupMenu
        id={moveMenuId}
        open={showMoveMenu}
        onClose={closeMoveMenu}
        triggerRef={displayButtonRef}
        label={`Move "${item.text}" to quadrant`}
        items={moveTargets.map((target) => ({
          label: `Move to ${target.label}`,
          onSelect: () => onMove(target.index),
        }))}
        className="left-0 mt-1"
      />
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
  /** The positioned, untransformed ancestor the ghost is absolute within. */
  containerRef: React.RefObject<HTMLElement | null>
}

export function GhostCard({ drag, text, containerRef }: GhostCardProps) {
  // Positioned absolutely inside a measured container, not fixed at raw
  // client coordinates: pointer coords and client rects share one coordinate
  // space per browser (visual-viewport-based on iOS Safari under pinch zoom),
  // while fixed anchors to the layout viewport and drifts from the finger by
  // the pinch pan (BUG-018). Re-measured every render, never held in state
  // (the BUG-012 lesson).
  const containerRect = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 }
  const { x, y } = clientToContainerPoint(drag.x - drag.grabX, drag.y - drag.grabY, containerRect)
  return (
    <div
      aria-hidden="true"
      className="absolute w-max max-w-[180px] min-w-[60px] py-[7px] px-2.5 bg-white dark:bg-gray-700 border border-black/8 dark:border-white/10 rounded-lg shadow-lg text-[13px] leading-[1.4] flex items-start gap-1 cursor-grabbing opacity-92"
      style={{
        left: x,
        top: y,
        width: drag.width,
        pointerEvents: 'none',
        zIndex: 9999,
      }}>
      <span className="flex-1 min-w-0 break-words">{text}</span>
    </div>
  )
}
