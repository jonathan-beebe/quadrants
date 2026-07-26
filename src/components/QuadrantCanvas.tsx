import { useState, useRef, useCallback, useEffect } from 'react'
import { createItem, addItem, removeItem, updateItemText, setQuadrantColor, moveItem } from '../logic/items'
import { useIsMobile } from '../hooks/useIsMobile'
import useDragAndDrop from '../hooks/useDragAndDrop'
import type { DropResult } from '../hooks/useDragAndDrop'
import { GhostCard, PLACEHOLDER } from './Card'
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
  const [shareStatus, setShareStatus] = useState<'copied' | 'error' | null>(null)
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null)
  const [liveMessage, setLiveMessage] = useState('')
  const quadrantRefs = useRef<(HTMLElement | null)[]>([null, null, null, null])
  const canvasRefs = useRef<(HTMLElement | null)[]>([null, null, null, null])
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

  const handleAddItem = useCallback(
    (quadrantIdx: number) => {
      const newItem = createItem(PLACEHOLDER)
      setAutoFocusId(newItem.id)
      updateFramework((fw) => addItem(fw, quadrantIdx, newItem))
      announce(`New item added to ${frameworkRef.current.quadrants[quadrantIdx].label}`)
    },
    [updateFramework, announce],
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
    // h-svh, not h-screen: `vh` resolves to the large viewport, so the canvas
    // bottom — and the zoomed cell's footer controls pinned to it — rendered
    // behind mobile Safari's bottom toolbar (BUG-015). `svh` is the viewport
    // with browser chrome shown. Deliberately not `dvh`: a unit that changes as
    // chrome retracts would resize the canvas mid-interaction and reintroduce
    // the card-position shift 4996ae3 removed.
    <div className={`flex flex-col h-svh select-none ${isMobile ? 'p-0' : 'p-6'}`}>
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
      />

      {drag && draggedItem && <GhostCard drag={drag} text={draggedItem.text} />}
      <div className="sr-only" aria-live="polite" role="status">
        {liveMessage}
      </div>
    </div>
  )
}
