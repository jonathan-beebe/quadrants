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

/**
 * Given client (viewport-relative) coordinates and the client rect of a
 * positioned container, returns the point in that container's local
 * coordinate space.
 *
 * Event clientX/clientY and getBoundingClientRect() report in the same client
 * space within any one browser — layout-viewport-based in Chrome/Firefox,
 * visual-viewport-based in iOS Safari under pinch zoom — so this difference
 * holds at any pinch-zoom level. `position: fixed` at raw client coordinates
 * does not: fixed anchors to the layout viewport and drifts from the pointer
 * by the pinch pan on Safari (BUG-018).
 */
export function clientToContainerPoint(
  clientX: number,
  clientY: number,
  containerRect: { left: number; top: number },
): { x: number; y: number } {
  return { x: clientX - containerRect.left, y: clientY - containerRect.top }
}

export default function useDragAndDrop({ quadrantRefs, canvasRefs, onDrop }: UseDragAndDropOptions) {
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
