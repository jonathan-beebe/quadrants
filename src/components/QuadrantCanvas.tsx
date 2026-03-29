import { useState, useRef, useCallback } from 'react'
import { createItem } from '../storage'
import { addItem, removeItem, updateItemText, setQuadrantColor, moveItem } from '../logic/items'
import { useIsMobile } from '../hooks/useIsMobile'
import useDragAndDrop from '../hooks/useDragAndDrop'
import type { DropResult } from '../hooks/useDragAndDrop'
import { GhostCard, PLACEHOLDER } from './Card'
import { EditIcon, ShareIcon, MaximizeIcon, SidebarIcon } from './Icons'
import PageTitle from './atoms/PageTitle'
import Button from './atoms/Button'
import QuadrantGrid from './QuadrantGrid'
import MobileQuadrantGrid from './MobileQuadrantGrid'
import type { Framework, Item } from '../types'
import type { DragStartInfo } from './Card'

interface QuadrantCanvasProps {
  framework: Framework
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onUpdate: (framework: Framework) => void
  onReflect: () => void
  onEdit: () => void
  onShare: (framework: Framework) => Promise<string>
}

export default function QuadrantCanvas({
  framework,
  sidebarOpen,
  onToggleSidebar,
  onUpdate,
  onReflect,
  onEdit,
  onShare,
}: QuadrantCanvasProps) {
  const isMobile = useIsMobile()
  const [shareStatus, setShareStatus] = useState<'copied' | 'error' | null>(null)
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null)
  const [liveMessage, setLiveMessage] = useState('')
  const quadrantRefs = useRef<(HTMLElement | null)[]>([null, null, null, null])
  const canvasRefs = useRef<(HTMLElement | null)[]>([null, null, null, null])

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

  const handleDeleteItem = useCallback(
    (quadrantIdx: number, itemId: string) => {
      const item = frameworkRef.current.quadrants[quadrantIdx].items.find((i) => i.id === itemId)
      updateFramework((fw) => removeItem(fw, quadrantIdx, itemId))
      const label = frameworkRef.current.quadrants[quadrantIdx].label
      const itemText = item ? `"${item.text}"` : ''
      announce(item ? `Item ${itemText} deleted from ${label}` : `Item deleted from ${label}`)
    },
    [updateFramework, announce],
  )

  const handleEditItem = useCallback(
    (quadrantIdx: number, itemId: string, text: string) => {
      updateFramework((fw) => updateItemText(fw, quadrantIdx, itemId, text))
    },
    [updateFramework],
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

  const handleDragStart_ = useCallback(
    (quadrantIdx: number, item: Item, info: DragStartInfo) => {
      handleDragStart(quadrantIdx, item, info)
    },
    [handleDragStart],
  )

  let draggedItem = null
  if (drag) {
    const q = framework.quadrants[drag.sourceIdx]
    draggedItem = q?.items.find((it) => it.id === drag.itemId) ?? null
  }

  const handleShare = useCallback(async () => {
    try {
      await onShare(framework)
      setShareStatus('copied')
      setTimeout(() => setShareStatus(null), 2000)
    } catch {
      setShareStatus('error')
      setTimeout(() => setShareStatus(null), 2000)
    }
  }, [onShare, framework])

  const Grid = isMobile ? MobileQuadrantGrid : QuadrantGrid

  return (
    <div className={`flex flex-col h-screen select-none ${isMobile ? 'p-0' : 'p-6'}`}>
      <div
        className={`flex items-center justify-between shrink-0 ${isMobile ? 'px-3 py-2.5 border-b border-border' : 'mb-5'} ${!isMobile && !sidebarOpen ? 'pl-12' : ''}`}>
        <div className="flex items-center gap-2 min-w-0">
          {isMobile && (
            <Button variant="icon" onClick={onToggleSidebar} aria-label="Open sidebar" aria-expanded={sidebarOpen}>
              <SidebarIcon size={18} />
            </Button>
          )}
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
          <Button variant="secondary" size="sm" onClick={onReflect}>
            <MaximizeIcon size={14} />
            Reflect
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
        onDragStart={handleDragStart_}
      />

      {drag && draggedItem && <GhostCard drag={drag} text={draggedItem.text} />}
      <div className="sr-only" aria-live="polite" role="status">
        {liveMessage}
      </div>
    </div>
  )
}
