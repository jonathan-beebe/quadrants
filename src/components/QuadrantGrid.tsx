import { deriveColors, defaultColors } from '../colors'
import ColorPicker from './ColorPicker'
import Card from './Card'
import { PlusIcon } from './Icons'
import Badge from './atoms/Badge'
import type { Framework, Item } from '../types'
import type { DragStartInfo, DragState } from './Card'

export interface QuadrantGridProps {
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

export default function QuadrantGrid({
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
}: QuadrantGridProps) {
  return (
    <div
      className="flex-1 flex min-h-0 relative"
      role="group"
      aria-label={[
        'Quadrant grid',
        framework.axisX && `horizontal axis: ${framework.axisX}`,
        framework.axisY && `vertical axis: ${framework.axisY}`,
      ]
        .filter(Boolean)
        .join(', ')}
    >
      {framework.axisY && (
        <div
          className="flex items-center justify-center shrink-0 w-6"
          aria-hidden="true"
        >
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
                  quadrantRefs.current![idx] = el
                }}
              >
                <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1.5 shrink-0">
                  <h2 className="text-[13px] font-semibold">{quadrant.label}</h2>
                  <div className="flex items-center gap-1.5">
                    <ColorPicker
                      color={qColor}
                      onChange={(c) => onColorChange(idx, c)}
                    />
                    <Badge
                      count={quadrant.items.length}
                      label={`${quadrant.items.length} items in ${quadrant.label}`}
                    />
                    <button
                      className="p-[3px] rounded text-text-tertiary transition-all duration-150 hover:text-text-secondary hover:bg-black/6 dark:hover:bg-white/10"
                      onClick={() => onAddItem(idx)}
                      aria-label={`Add item to ${quadrant.label}`}
                    >
                      <PlusIcon size={14} />
                    </button>
                  </div>
                </div>
                <div
                  className="flex-1 relative min-h-0 overflow-visible"
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
                      onMove={(targetIdx) => onMoveItem(idx, item.id, targetIdx)}
                      onDragStart={(info) => onDragStart(idx, item, info)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
        {framework.axisX && (
          <div className="text-center pt-2 shrink-0" aria-hidden="true">
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
              {framework.axisX}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
