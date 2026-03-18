import { useState, useRef, useCallback } from 'react'
import { createItem } from '../storage'
import { addItem, removeItem, updateItemText, setQuadrantColor, moveItem } from '../logic/items'
import { deriveColors, defaultColors } from '../colors'
import useDragAndDrop from '../hooks/useDragAndDrop'
import type { DropResult } from '../hooks/useDragAndDrop'
import ColorPicker from './ColorPicker'
import Card, { GhostCard, PLACEHOLDER } from './Card'
import { EditIcon, ShareIcon, MaximizeIcon, PlusIcon } from './Icons'
import type { Framework } from '../types'

interface QuadrantCanvasProps {
  framework: Framework
  sidebarOpen: boolean
  onUpdate: (framework: Framework) => void
  onReflect: () => void
  onEdit: () => void
  onShare: (framework: Framework) => Promise<string>
}

export default function QuadrantCanvas({
  framework,
  sidebarOpen,
  onUpdate,
  onReflect,
  onEdit,
  onShare,
}: QuadrantCanvasProps) {
  const [shareStatus, setShareStatus] = useState<'copied' | 'error' | null>(null)
  const [autoFocusId, setAutoFocusId] = useState<string | null>(null)
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
      updateFramework((fw) =>
        moveItem(fw, result.sourceIdx, result.targetIdx, result.itemId, result.x, result.y),
      )
    },
    [updateFramework],
  )

  const { drag, handleDragStart } = useDragAndDrop({
    quadrantRefs,
    canvasRefs,
    onDrop: handleDrop,
  })

  const handleAddItem = useCallback(
    (quadrantIdx: number) => {
      const newItem = createItem(PLACEHOLDER)
      setAutoFocusId(newItem.id)
      updateFramework((fw) => addItem(fw, quadrantIdx, newItem))
    },
    [updateFramework],
  )

  const handleDeleteItem = useCallback(
    (quadrantIdx: number, itemId: string) => {
      updateFramework((fw) => removeItem(fw, quadrantIdx, itemId))
    },
    [updateFramework],
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

  let draggedItem = null
  if (drag) {
    const q = framework.quadrants[drag.sourceIdx]
    draggedItem = q?.items.find((it) => it.id === drag.itemId) ?? null
  }

  return (
    <div className="flex flex-col h-screen p-6 select-none">
      <div
        className={`flex items-center justify-between mb-5 shrink-0 ${sidebarOpen ? '' : 'pl-12'}`}
      >
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{framework.name}</h1>
          <button
            className="btn-ghost btn-sm"
            onClick={onEdit}
            title="Edit framework"
          >
            <EditIcon size={14} />
            Edit
          </button>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary btn-sm"
            onClick={async () => {
              try {
                await onShare(framework)
                setShareStatus('copied')
                setTimeout(() => setShareStatus(null), 2000)
              } catch {
                setShareStatus('error')
                setTimeout(() => setShareStatus(null), 2000)
              }
            }}
          >
            <ShareIcon size={14} />
            <span aria-live="polite">
              {shareStatus === 'copied' ? 'Link copied!' : shareStatus === 'error' ? 'Share failed' : 'Share'}
            </span>
          </button>
          <button className="btn-secondary btn-sm" onClick={onReflect}>
            <MaximizeIcon size={14} />
            Reflect
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 relative">
        {framework.axisY && (
          <div className="flex items-center justify-center shrink-0 w-6">
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider -rotate-90 whitespace-nowrap">
              {framework.axisY}
            </span>
          </div>
        )}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1 min-h-0">
            {framework.quadrants.map((quadrant, idx) => {
              const qColor = quadrant.color || defaultColors[idx]
              const { bg, border } = deriveColors(qColor)
              return (
                <section
                  key={idx}
                  aria-label={quadrant.label}
                  className="flex flex-col rounded-xl border overflow-visible transition-[border-color] duration-150"
                  style={{ background: bg, borderColor: border }}
                  ref={(el) => {
                    quadrantRefs.current[idx] = el
                  }}
                >
                  <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1.5 shrink-0">
                    <h3 className="text-[13px] font-semibold">
                      {quadrant.label}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <ColorPicker
                        color={qColor}
                        onChange={(c) => handleColorChange(idx, c)}
                      />
                      <span
                        className="text-[11px] text-text-tertiary bg-black/6 dark:bg-white/10 px-[7px] py-px rounded-full"
                        aria-label={`${quadrant.items.length} items in ${quadrant.label}`}
                      >
                        {quadrant.items.length}
                      </span>
                      <button
                        className="p-[3px] rounded text-text-tertiary transition-all duration-150 hover:text-text-secondary hover:bg-black/6 dark:hover:bg-white/10"
                        onClick={() => handleAddItem(idx)}
                        aria-label={`Add item to ${quadrant.label}`}
                      >
                        <PlusIcon size={14} />
                      </button>
                    </div>
                  </div>
                  <div
                    className="flex-1 relative min-h-0 overflow-visible"
                    ref={(el) => {
                      canvasRefs.current[idx] = el
                    }}
                  >
                    {quadrant.items.map((item) => (
                      <Card
                        key={item.id}
                        item={item}
                        isDragging={drag?.itemId === item.id}
                        autoFocus={autoFocusId === item.id}
                        onChange={(text) => handleEditItem(idx, item.id, text)}
                        onDelete={() => handleDeleteItem(idx, item.id)}
                        onDragStart={(info) =>
                          handleDragStart(idx, item, info)
                        }
                      />
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
          {framework.axisX && (
            <div className="text-center pt-2 shrink-0">
              <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
                {framework.axisX}
              </span>
            </div>
          )}
        </div>
      </div>

      {drag && draggedItem && <GhostCard drag={drag} text={draggedItem.text} />}
    </div>
  )
}
