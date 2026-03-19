import { useState, useCallback } from 'react'
import { deriveColors, defaultColors } from '../colors'
import ColorPicker from './ColorPicker'
import Card from './Card'
import { PlusIcon } from './Icons'
import Badge from './atoms/Badge'
import Button from './atoms/Button'
import type { Framework, Item } from '../types'
import type { DragStartInfo, DragState } from './Card'

export interface MobileQuadrantGridProps {
  framework: Framework
  drag: DragState | null
  autoFocusId: string | null
  quadrantRefs: React.RefObject<(HTMLElement | null)[]>
  canvasRefs: React.RefObject<(HTMLElement | null)[]>
  onAddItem: (quadrantIdx: number) => void
  onDeleteItem: (quadrantIdx: number, itemId: string) => void
  onEditItem: (quadrantIdx: number, itemId: string, text: string) => void
  onColorChange: (quadrantIdx: number, color: string) => void
  onMoveItem: (sourceIdx: number, itemId: string, targetIdx: number) => void
  onDragStart: (quadrantIdx: number, item: Item, info: DragStartInfo) => void
}

const TRANSITION = 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)'

/** Translate values to pan each quadrant into view at scale(1). */
const CELL_TRANSFORMS: Record<number, string> = {
  0: 'translate(0%, 0%)',       // top-left
  1: 'translate(-50%, 0%)',     // top-right
  2: 'translate(0%, -50%)',     // bottom-left
  3: 'translate(-50%, -50%)',   // bottom-right
}

const OVERVIEW_TRANSFORM = 'scale(0.5)'

export default function MobileQuadrantGrid({
  framework,
  drag,
  autoFocusId,
  quadrantRefs,
  canvasRefs,
  onAddItem,
  onDeleteItem,
  onEditItem,
  onColorChange,
  onMoveItem,
  onDragStart,
}: MobileQuadrantGridProps) {
  const [zoomedIdx, setZoomedIdx] = useState<number | null>(null)
  const isZoomed = zoomedIdx !== null

  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isZoomed) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const col = x < rect.width / 2 ? 0 : 1
      const row = y < rect.height / 2 ? 0 : 1
      setZoomedIdx(row * 2 + col)
    },
    [isZoomed],
  )

  const gridTransform = isZoomed
    ? CELL_TRANSFORMS[zoomedIdx]
    : OVERVIEW_TRANSFORM

  return (
    <div className="relative flex-1 min-h-0 overflow-hidden select-none">
      {/* 2x2 grid at 200% x 200%, scaled/panned via transform */}
      <div
        className="grid grid-cols-2 grid-rows-2 w-[200%] h-[200%] origin-top-left"
        style={{ transform: gridTransform, transition: TRANSITION }}
        onClick={!isZoomed ? handleGridClick : undefined}
        role="group"
        aria-label="Quadrant grid"
      >
        {framework.quadrants.map((quadrant, idx) => {
          const qColor = quadrant.color || defaultColors[idx]
          const { bg, border } = deriveColors(qColor)
          const isFocused = zoomedIdx === idx

          return (
            <section
              key={idx}
              aria-label={quadrant.label}
              className="flex flex-col border overflow-hidden"
              style={{ background: bg, borderColor: border }}
              ref={(el) => {
                quadrantRefs.current![idx] = el
              }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-3 py-2.5 border-b shrink-0"
                style={{ borderColor: border }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <h2 className="text-sm font-semibold truncate">
                    {quadrant.label}
                  </h2>
                  <div
                    className="flex items-center gap-1.5 shrink-0"
                    style={{ pointerEvents: isFocused ? 'auto' : 'none' }}
                  >
                    <ColorPicker
                      color={qColor}
                      onChange={(c) => onColorChange(idx, c)}
                    />
                    <Badge
                      count={quadrant.items.length}
                      label={`${quadrant.items.length} items in ${quadrant.label}`}
                    />
                  </div>
                </div>
                {isFocused && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setZoomedIdx(null)}
                  >
                    Done
                  </Button>
                )}
              </div>

              {/* Canvas */}
              <div
                className="flex-1 relative min-h-0"
                style={{ pointerEvents: isFocused ? 'auto' : 'none' }}
                ref={(el) => {
                  canvasRefs.current![idx] = el
                }}
              >
                {quadrant.items.map((item) => (
                  <Card
                    key={item.id}
                    item={item}
                    isDragging={drag?.itemId === item.id}
                    autoFocus={autoFocusId === item.id}
                    moveTargets={framework.quadrants
                      .map((q, i) => ({ label: q.label, index: i }))
                      .filter((t) => t.index !== idx)}
                    onChange={(text) => onEditItem(idx, item.id, text)}
                    onDelete={() => onDeleteItem(idx, item.id)}
                    onMove={(targetIdx) =>
                      onMoveItem(idx, item.id, targetIdx)
                    }
                    onDragStart={(info) => onDragStart(idx, item, info)}
                  />
                ))}
              </div>

              {/* Footer — add button */}
              {isFocused && (
                <div
                  className="flex items-center justify-center px-3 py-2 border-t shrink-0"
                  style={{ borderColor: border }}
                >
                  <button
                    className="p-2 rounded-lg text-text-secondary transition-all duration-150 hover:text-text hover:bg-black/6 dark:hover:bg-white/10"
                    onClick={() => onAddItem(idx)}
                    aria-label={`Add item to ${quadrant.label}`}
                  >
                    <PlusIcon size={20} />
                  </button>
                </div>
              )}
            </section>
          )
        })}
      </div>
    </div>
  )
}
