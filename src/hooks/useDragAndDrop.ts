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
 * Given page coordinates and a bounding rect, returns clamped percentage
 * coordinates within that rect.
 */
export function pageToQuadrantPercent(pageX: number, pageY: number, rect: DOMRect): { x: number; y: number } {
  const x = ((pageX - rect.left) / rect.width) * 100
  const y = ((pageY - rect.top) / rect.height) * 100
  return {
    x: Math.max(2, Math.min(x, 85)),
    y: Math.max(2, Math.min(y, 85)),
  }
}

/**
 * Given page coordinates and an array of element refs, returns the quadrant
 * whose bounding box contains the point, or null.
 */
export function getQuadrantAtPoint(
  pageX: number,
  pageY: number,
  quadrantEls: (HTMLElement | null)[],
  canvasEls: (HTMLElement | null)[],
): QuadrantTarget | null {
  for (let i = 0; i < 4; i++) {
    const el = quadrantEls[i]
    if (!el) continue
    const rect = el.getBoundingClientRect()
    if (pageX >= rect.left && pageX <= rect.right && pageY >= rect.top && pageY <= rect.bottom) {
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
      setDrag((prev) => (prev ? { ...prev, x: e.pageX, y: e.pageY } : null))
    }

    const handleUp = (e: PointerEvent) => {
      setDrag((prev) => {
        if (!prev) return null
        const target = getQuadrantAtPoint(e.pageX, e.pageY, quadrantRefs.current!, canvasRefs.current!)
        if (target) {
          const { x, y } = pageToQuadrantPercent(e.pageX - prev.grabX, e.pageY - prev.grabY, target.rect)
          onDropRef.current({
            itemId: prev.itemId,
            sourceIdx: prev.sourceIdx,
            targetIdx: target.index,
            x,
            y,
          })
        }
        return null
      })
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
      x: info.pageX,
      y: info.pageY,
    })
  }, [])

  return { drag, handleDragStart }
}
