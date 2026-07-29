import { useState, useRef, useCallback, useEffect } from 'react'
import { flushSync } from 'react-dom'
import { createItem, addItem, removeItem, updateItemText, setQuadrantColor, moveItem } from '../logic/items'
import { useIsMobile } from '../hooks/useIsMobile'
import { useExpectsOnScreenKeyboard } from '../hooks/useExpectsOnScreenKeyboard'
import { useDragAndDrop } from '../hooks/useDragAndDrop'
import type { DropResult } from '../hooks/useDragAndDrop'
import { GhostCard, PLACEHOLDER } from './Card'
import EditModal from './EditModal'
import { EditIcon, ShareIcon } from './Icons'
import PageTitle from './atoms/PageTitle'
import Button from './atoms/Button'
import SidebarToggleButton from './atoms/SidebarToggleButton'
import QuadrantGrid from './QuadrantGrid'
import MobileQuadrantGrid from './MobileQuadrantGrid'
import type { Framework } from '../types'
import type { ShareResult } from '../hooks/useFrameworkSharing'

interface QuadrantCanvasProps {
  framework: Framework
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onUpdate: (framework: Framework) => void
  onEdit: () => void
  onShare: (framework: Framework) => Promise<ShareResult>
}

export default function QuadrantCanvas({
  framework,
  sidebarOpen,
  onToggleSidebar,
  onUpdate,
  onEdit,
  onShare,
}: QuadrantCanvasProps) {
  const isMobile = useIsMobile()
  const expectsKeyboard = useExpectsOnScreenKeyboard()
  const [shareStatus, setShareStatus] = useState<'copied' | 'error' | null>(null)
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null)
  // itemId null = adding a new item to the quadrant; the item exists only
  // once the modal saves, so cancelling never leaves a placeholder (BUG-004's
  // whole failure mode has nothing to attach to on this path).
  const [itemModal, setItemModal] = useState<{ quadrantIdx: number; itemId: string | null } | null>(null)
  const modalOpenerRef = useRef<HTMLElement | null>(null)
  const [liveMessage, setLiveMessage] = useState('')
  const quadrantRefs = useRef<(HTMLElement | null)[]>([null, null, null, null])
  const canvasRefs = useRef<(HTMLElement | null)[]>([null, null, null, null])
  const rootRef = useRef<HTMLDivElement>(null)
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
    }
  }, [])

  const frameworkRef = useRef(framework)
  frameworkRef.current = framework

  const updateFramework = useCallback(
    (updater: (fw: Framework) => Framework) => {
      const updated = updater(frameworkRef.current)
      onUpdate({ ...updated, updatedAt: Date.now() })
    },
    [onUpdate],
  )

  const handleDrop = useCallback(
    (result: DropResult) => {
      updateFramework((fw) => moveItem(fw, result.sourceIdx, result.targetIdx, result.itemId, result.x, result.y))
    },
    [updateFramework],
  )

  const { drag, handleDragStart } = useDragAndDrop({
    quadrantRefs,
    canvasRefs,
    onDrop: handleDrop,
  })

  const announce = useCallback((message: string) => {
    setLiveMessage('')
    requestAnimationFrame(() => setLiveMessage(message))
  }, [])

  // The modal must mount — and take focus via its layout effect — inside the
  // gesture that requested it, or iOS will not raise the keyboard (RSRCH-002).
  // Card resolves a tap in a native window pointerup listener, where React
  // defers state updates past the gesture; flushSync commits the mount now.
  const openItemModal = useCallback((quadrantIdx: number, itemId: string | null, opener: HTMLElement) => {
    modalOpenerRef.current = opener
    flushSync(() => setItemModal({ quadrantIdx, itemId }))
  }, [])

  const handleRequestEditItem = useCallback(
    (quadrantIdx: number, itemId: string, opener: HTMLElement) => openItemModal(quadrantIdx, itemId, opener),
    [openItemModal],
  )

  const handleAddItem = useCallback(
    (quadrantIdx: number, opener?: HTMLElement) => {
      if (expectsKeyboard && opener) {
        openItemModal(quadrantIdx, null, opener)
        return
      }
      const newItem = createItem(PLACEHOLDER)
      setAutoFocusId(newItem.id)
      updateFramework((fw) => addItem(fw, quadrantIdx, newItem))
      announce(`New item added to ${frameworkRef.current.quadrants[quadrantIdx].label}`)
    },
    [expectsKeyboard, openItemModal, updateFramework, announce],
  )

  // autoFocusId is one-shot: once the freshly added item's edit session ends
  // (text committed or item deleted), clear it so a later grid remount (e.g.
  // crossing the mobile breakpoint) doesn't re-open edit mode (BUG-009).
  const consumeAutoFocus = useCallback((itemId: string) => {
    setAutoFocusId((current) => (current === itemId ? null : current))
  }, [])

  const handleDeleteItem = useCallback(
    (quadrantIdx: number, itemId: string) => {
      const item = frameworkRef.current.quadrants[quadrantIdx].items.find((i) => i.id === itemId)
      updateFramework((fw) => removeItem(fw, quadrantIdx, itemId))
      consumeAutoFocus(itemId)
      const label = frameworkRef.current.quadrants[quadrantIdx].label
      const itemText = item ? `"${item.text}"` : ''
      announce(item ? `Item ${itemText} deleted from ${label}` : `Item deleted from ${label}`)
    },
    [updateFramework, announce, consumeAutoFocus],
  )

  const handleEditItem = useCallback(
    (quadrantIdx: number, itemId: string, text: string) => {
      updateFramework((fw) => updateItemText(fw, quadrantIdx, itemId, text))
      consumeAutoFocus(itemId)
    },
    [updateFramework, consumeAutoFocus],
  )

  const closeItemModal = useCallback(() => setItemModal(null), [])

  const handleModalSave = useCallback(
    (text: string) => {
      if (!itemModal) return
      const { quadrantIdx, itemId } = itemModal
      const trimmed = text.trim()
      if (itemId === null) {
        if (trimmed) {
          updateFramework((fw) => addItem(fw, quadrantIdx, createItem(trimmed)))
          announce(`New item added to ${frameworkRef.current.quadrants[quadrantIdx].label}`)
        }
      } else if (trimmed) {
        handleEditItem(quadrantIdx, itemId, trimmed)
      } else {
        // Saving an item empty deletes it, mirroring the inline commit.
        handleDeleteItem(quadrantIdx, itemId)
      }
      setItemModal(null)
    },
    [itemModal, updateFramework, announce, handleEditItem, handleDeleteItem],
  )

  const handleModalDelete = useCallback(() => {
    if (itemModal?.itemId != null) handleDeleteItem(itemModal.quadrantIdx, itemModal.itemId)
    setItemModal(null)
  }, [itemModal, handleDeleteItem])

  const handleColorChange = useCallback(
    (quadrantIdx: number, color: string) => {
      updateFramework((fw) => setQuadrantColor(fw, quadrantIdx, color))
    },
    [updateFramework],
  )

  const handleMoveItem = useCallback(
    (sourceIdx: number, itemId: string, targetIdx: number) => {
      const item = frameworkRef.current.quadrants[sourceIdx].items.find((i) => i.id === itemId)
      const targetLabel = frameworkRef.current.quadrants[targetIdx].label
      updateFramework((fw) => moveItem(fw, sourceIdx, targetIdx, itemId, 10, 10))
      announce(`Item "${item?.text ?? ''}" moved to ${targetLabel}`)
    },
    [updateFramework, announce],
  )

  const handleRepositionItem = useCallback(
    (quadrantIdx: number, itemId: string, x: number, y: number) => {
      const item = frameworkRef.current.quadrants[quadrantIdx].items.find((i) => i.id === itemId)
      updateFramework((fw) => moveItem(fw, quadrantIdx, quadrantIdx, itemId, x, y))
      announce(`Item "${item?.text ?? ''}" moved to ${Math.round(x)}% horizontal, ${Math.round(y)}% vertical`)
    },
    [updateFramework, announce],
  )

  let draggedItem = null
  if (drag) {
    const q = framework.quadrants[drag.sourceIdx]
    draggedItem = q?.items.find((it) => it.id === drag.itemId) ?? null
  }

  const modalItem = itemModal?.itemId
    ? (framework.quadrants[itemModal.quadrantIdx]?.items.find((it) => it.id === itemModal.itemId) ?? null)
    : null

  const handleShare = useCallback(async () => {
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current)
    try {
      const result = await onShare(framework)
      if (result.outcome === 'copied') {
        setShareStatus('copied')
        shareTimerRef.current = setTimeout(() => setShareStatus(null), 2000)
      } else if (result.outcome === 'failed') {
        setShareStatus('error')
        shareTimerRef.current = setTimeout(() => setShareStatus(null), 2000)
      }
      // 'shared' / 'cancelled': native share UI handled the affordance — no toast.
    } catch {
      setShareStatus('error')
      shareTimerRef.current = setTimeout(() => setShareStatus(null), 2000)
    }
  }, [onShare, framework])

  const Grid = isMobile ? MobileQuadrantGrid : QuadrantGrid

  return (
    // h-full: the canvas fills <main> exactly, so there is nothing for <main>
    // to scroll and the canvas stays fixed under a drag. This was `h-svh`, from
    // BUG-015 — `vh` had put the canvas bottom, and the zoomed cell's footer
    // controls pinned to it, behind mobile Safari's toolbar. The shell now
    // states that height once (App.tsx) and this defers to it; two independent
    // claims on the viewport is what BUG-017 was.
    //
    // Still deliberately not `dvh` anywhere in the chain: a unit that changes
    // as chrome retracts would resize the canvas mid-interaction and
    // reintroduce the card-position shift 4996ae3 removed.
    // `relative`: this root is the positioned container GhostCard anchors to
    // (see GhostCard for the pinch-zoom coordinate-space reasoning, BUG-018).
    <div ref={rootRef} className={`relative flex flex-col h-full select-none ${isMobile ? 'p-0' : 'p-6'}`}>
      <div
        className={`flex items-center justify-between shrink-0 ${isMobile ? 'px-3 py-2.5 border-b border-border' : 'mb-5'} ${!isMobile && !sidebarOpen ? 'pl-12' : ''}`}>
        <div className="flex items-center gap-2 min-w-0">
          {isMobile && <SidebarToggleButton open={sidebarOpen} onToggle={onToggleSidebar} />}
          <PageTitle className={isMobile ? 'text-base truncate' : undefined}>{framework.name}</PageTitle>
          {!isMobile && (
            <Button variant="ghost" size="sm" onClick={onEdit} title="Edit framework">
              <EditIcon size={14} />
              Edit
            </Button>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={handleShare}>
            <ShareIcon size={14} />
            <span aria-live="polite">
              {shareStatus === 'copied' ? 'Link copied!' : shareStatus === 'error' ? 'Share failed' : 'Share'}
            </span>
          </Button>
        </div>
      </div>

      <Grid
        framework={framework}
        drag={drag}
        autoFocusId={autoFocusId}
        quadrantRefs={quadrantRefs}
        canvasRefs={canvasRefs}
        onAddItem={handleAddItem}
        onDeleteItem={handleDeleteItem}
        onEditItem={handleEditItem}
        onColorChange={handleColorChange}
        onMoveItem={handleMoveItem}
        onReposition={handleRepositionItem}
        onDragStart={handleDragStart}
        onRequestEditItem={expectsKeyboard ? handleRequestEditItem : undefined}
      />

      {itemModal && (itemModal.itemId === null || modalItem) && (
        <EditModal
          title={itemModal.itemId === null ? 'Add item' : 'Edit item'}
          value={modalItem?.text ?? ''}
          openerRef={modalOpenerRef}
          onSave={handleModalSave}
          onDelete={handleModalDelete}
          onCancel={closeItemModal}
        />
      )}

      {drag && draggedItem && <GhostCard drag={drag} text={draggedItem.text} containerRef={rootRef} />}
      <div className="sr-only" aria-live="polite" role="status">
        {liveMessage}
      </div>
    </div>
  )
}
