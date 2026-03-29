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
        .join(', ')}>
      {framework.axisY && (
        <div className="flex flex-col items-center shrink-0 w-6 py-2 text-text-tertiary" aria-hidden="true">
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M5 9 L5 1 M2 4 L5 1 L8 4" />
          </svg>
          <div className="flex-1 w-px bg-current opacity-30" />
          <span className="text-xs font-medium uppercase tracking-wider -rotate-90 whitespace-nowrap my-2">
            {framework.axisY}
          </span>
          <div className="flex-1 w-px bg-current opacity-30" />
          <svg
            width="10"
            height="10"
            viewBox="0 0 10 10"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M5 1 L5 9 M2 6 L5 9 L8 6" />
          </svg>
        </div>
      )}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1 min-h-0">
          {framework.quadrants.map((quadrant, idx) => {
            const qColor = quadrant.color || defaultColors[idx]
            const { bg, border } = deriveColors(qColor)
            const isRight = idx === 1 || idx === 3
            const isBottom = idx === 2 || idx === 3

            const header = (
              <div
                className={`flex items-center justify-between px-3.5 pt-2.5 pb-1.5 shrink-0 ${isRight ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-1.5 ${isRight ? 'flex-row-reverse' : ''}`}>
                  <h2 className="text-[13px] font-semibold">{quadrant.label}</h2>
                  <Badge count={quadrant.items.length} label={`${quadrant.items.length} items in ${quadrant.label}`} />
                </div>
                <div className="flex items-center gap-1.5">
                  <ColorPicker color={qColor} onChange={(c) => onColorChange(idx, c)} />
                  <button
                    className="p-[3px] rounded text-text-tertiary transition-all duration-150 hover:text-text-secondary hover:bg-black/6 dark:hover:bg-white/10"
                    onClick={() => onAddItem(idx)}
                    aria-label={`Add item to ${quadrant.label}`}>
                    <PlusIcon size={14} />
                  </button>
                </div>
              </div>
            )

            return (
              <section
                key={idx}
                aria-label={quadrant.label}
                className="flex flex-col rounded-xl border overflow-visible transition-[border-color] duration-150"
                style={{ background: bg, borderColor: border }}
                ref={(el) => {
                  quadrantRefs.current![idx] = el
                }}>
                {!isBottom && header}
                <div
                  className="flex-1 relative min-h-0 overflow-visible"
                  ref={(el) => {
                    canvasRefs.current![idx] = el
                  }}>
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
                {isBottom && header}
              </section>
            )
          })}
        </div>
        {framework.axisX && (
          <div className="flex items-center shrink-0 pt-2 px-2 text-text-tertiary" aria-hidden="true">
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M9 5 L1 5 M4 2 L1 5 L4 8" />
            </svg>
            <div className="flex-1 h-px bg-current opacity-30" />
            <span className="text-xs font-medium uppercase tracking-wider whitespace-nowrap mx-2">
              {framework.axisX}
            </span>
            <div className="flex-1 h-px bg-current opacity-30" />
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round">
              <path d="M1 5 L9 5 M6 2 L9 5 L6 8" />
            </svg>
          </div>
        )}
      </div>
    </div>
  )
}
