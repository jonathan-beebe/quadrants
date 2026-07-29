import { useState, useRef, useCallback, useEffect } from 'react'
import { clientToQuadrantPercent, getQuadrantAtPoint } from '../logic/items'
import type { Item } from '../types'
import type { DragStartInfo, DragState } from '../components/Card'

export interface DropResult {
  itemId: string
  sourceIdx: number
  targetIdx: number
  x: number
  y: number
}

export interface UseDragAndDropOptions {
  quadrantRefs: React.RefObject<(HTMLElement | null)[]>
  canvasRefs: React.RefObject<(HTMLElement | null)[]>
  onDrop: (result: DropResult) => void
}

export function useDragAndDrop({ quadrantRefs, canvasRefs, onDrop }: UseDragAndDropOptions) {
  const [drag, setDrag] = useState<DragState | null>(null)
  const onDropRef = useRef(onDrop)
  onDropRef.current = onDrop

  useEffect(() => {
    if (!drag) return

    const handleMove = (e: PointerEvent) => {
      setDrag((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null))
    }

    const handleUp = (e: PointerEvent) => {
      // The effect re-subscribes on every `drag` change, so the closure's
      // `drag` is current. The drop side effect must stay outside the state
      // updater: React requires updaters to be pure, and StrictMode
      // double-invokes them in dev (MAINT-005).
      // Shell work: read the rects out of the DOM, then let the core rules
      // pick the target and the placement (RFCTR-009).
      const toRects = (els: (HTMLElement | null)[]) => els.map((el) => el?.getBoundingClientRect() ?? null)
      const target = getQuadrantAtPoint(
        e.clientX,
        e.clientY,
        toRects(quadrantRefs.current!),
        toRects(canvasRefs.current!),
      )
      if (target) {
        const { x, y } = clientToQuadrantPercent(e.clientX - drag.grabX, e.clientY - drag.grabY, target.rect)
        onDropRef.current({
          itemId: drag.itemId,
          sourceIdx: drag.sourceIdx,
          targetIdx: target.index,
          x,
          y,
        })
      }
      setDrag(null)
    }

    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [drag, quadrantRefs, canvasRefs])

  const handleDragStart = useCallback((quadrantIdx: number, item: Item, info: DragStartInfo) => {
    setDrag({
      itemId: item.id,
      sourceIdx: quadrantIdx,
      grabX: info.grabX,
      grabY: info.grabY,
      width: info.width,
      height: info.height,
      x: info.clientX,
      y: info.clientY,
    })
  }, [])

  return { drag, handleDragStart }
}
