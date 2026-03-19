import { useState } from 'react'
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

function OverviewCell({
  label,
  color,
  items,
  onClick,
}: {
  label: string
  color: string
  items: { id: string; text: string; x: number; y: number }[]
  onClick: () => void
}) {
  const { bg, border } = deriveColors(color)
  return (
    <button
      type="button"
      aria-label={`${label}, ${items.length} items. Tap to zoom in.`}
      className="flex flex-col rounded-lg border overflow-hidden text-left transition-[border-color] duration-150 active:scale-[0.97] active:brightness-95"
      style={{ background: bg, borderColor: border }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between px-2 pt-1.5 pb-1 shrink-0">
        <h2 className="text-[11px] font-semibold truncate">{label}</h2>
        <Badge count={items.length} />
      </div>
      <div className="flex-1 relative min-h-0">
        {items.map((item) => (
          <div
            key={item.id}
            className="absolute py-0.5 px-1.5 bg-white/80 dark:bg-white/10 border border-black/6 dark:border-white/8 rounded text-[8px] leading-tight truncate max-w-[65%]"
            style={{ left: `${item.x}%`, top: `${item.y}%` }}
          >
            {item.text}
          </div>
        ))}
      </div>
    </button>
  )
}

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

  if (zoomedIdx !== null) {
    const quadrant = framework.quadrants[zoomedIdx]
    const qColor = quadrant.color || defaultColors[zoomedIdx]
    const { bg, border } = deriveColors(qColor)

    return (
      <div className="flex flex-col flex-1 min-h-0 select-none">
        <div
          className="flex items-center justify-between px-3 py-2.5 border-b shrink-0"
          style={{ background: bg, borderColor: border }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-semibold truncate">{quadrant.label}</h2>
            <div className="flex items-center gap-1.5 shrink-0">
              <ColorPicker
                color={qColor}
                onChange={(c) => onColorChange(zoomedIdx, c)}
              />
              <Badge
                count={quadrant.items.length}
                label={`${quadrant.items.length} items in ${quadrant.label}`}
              />
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setZoomedIdx(null)}
          >
            Done
          </Button>
        </div>

        <section
          aria-label={quadrant.label}
          className="flex-1 relative min-h-0 overflow-hidden"
          style={{ background: bg }}
          ref={(el) => {
            quadrantRefs.current![zoomedIdx] = el
          }}
        >
          <div
            className="absolute inset-0"
            ref={(el) => {
              canvasRefs.current![zoomedIdx] = el
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
                  .filter((t) => t.index !== zoomedIdx)}
                onChange={(text) => onEditItem(zoomedIdx, item.id, text)}
                onDelete={() => onDeleteItem(zoomedIdx, item.id)}
                onMove={(targetIdx) =>
                  onMoveItem(zoomedIdx, item.id, targetIdx)
                }
                onDragStart={(info) => onDragStart(zoomedIdx, item, info)}
              />
            ))}
          </div>
        </section>

        <div
          className="flex items-center justify-center px-3 py-2 border-t shrink-0"
          style={{ borderColor: border, background: bg }}
        >
          <button
            className="p-2 rounded-lg text-text-secondary transition-all duration-150 hover:text-text hover:bg-black/6 dark:hover:bg-white/10"
            onClick={() => onAddItem(zoomedIdx)}
            aria-label={`Add item to ${quadrant.label}`}
          >
            <PlusIcon size={20} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-2 grid-rows-2 gap-1.5 flex-1 min-h-0 p-1.5 select-none"
      role="group"
      aria-label="Quadrant grid overview"
    >
      {framework.quadrants.map((quadrant, idx) => (
        <OverviewCell
          key={idx}
          label={quadrant.label}
          color={quadrant.color || defaultColors[idx]}
          items={quadrant.items}
          onClick={() => setZoomedIdx(idx)}
        />
      ))}
    </div>
  )
}
