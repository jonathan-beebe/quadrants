import { useState, useRef, useCallback, useEffect } from 'react'
import type { Item } from '../types'
import type { DragStartInfo, DragState } from '../components/Card'

export interface QuadrantTarget {
  index: number
  rect: DOMRect
}

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
 * Given client (viewport-relative) coordinates and a bounding rect, returns
 * clamped percentage coordinates within that rect.
 *
 * Uses clientX/clientY space to match getBoundingClientRect().
 */
export function clientToQuadrantPercent(clientX: number, clientY: number, rect: DOMRect): { x: number; y: number } {
  const x = ((clientX - rect.left) / rect.width) * 100
  const y = ((clientY - rect.top) / rect.height) * 100
  // Intentionally narrower than the canonical POSITION_MIN/MAX envelope
  // (logic/items.ts): a drop placement keeps the card fully inside the
  // quadrant. Positions outside [2,85] remain valid when produced by other
  // controls and must not be re-clamped on import.
  return {
    x: Math.max(2, Math.min(x, 85)),
    y: Math.max(2, Math.min(y, 85)),
  }
}

/**
 * Given client (viewport-relative) coordinates and an array of element refs,
 * returns the quadrant whose bounding box contains the point, or null.
 */
export function getQuadrantAtPoint(
  clientX: number,
  clientY: number,
  quadrantEls: (HTMLElement | null)[],
  canvasEls: (HTMLElement | null)[],
): QuadrantTarget | null {
  for (let i = 0; i < 4; i++) {
    const el = quadrantEls[i]
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
      const canvasRect = canvasEls[i]?.getBoundingClientRect() || rect
      return { index: i, rect: canvasRect }
    }
  }
  return null
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
      const target = getQuadrantAtPoint(e.clientX, e.clientY, quadrantRefs.current!, canvasRefs.current!)
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
