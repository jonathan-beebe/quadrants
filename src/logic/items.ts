import type { Framework, Item, MoveTarget, Quadrant } from '../types'

// Canonical envelope for persisted/imported item coordinates, matching the
// widest range the app's own controls can produce (keyboard repositioning).
// Drag-and-drop intentionally places drops in a narrower visual range, but
// any value inside this envelope is valid and must survive a share round-trip.
export const POSITION_MIN = 0
export const POSITION_MAX = 95

// The other half of that decision (RFCTR-009): drop placement is intentionally
// narrower than the canonical envelope so a dropped card lands fully inside
// the quadrant. Positions outside [2,85] remain valid when produced by other
// controls and must not be re-clamped on import.
const DROP_POSITION_MIN = 2
const DROP_POSITION_MAX = 85

export function clampPosition(value: number): number {
  return Math.max(POSITION_MIN, Math.min(value, POSITION_MAX))
}

export interface QuadrantTarget {
  index: number
  rect: DOMRect
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

/**
 * Given client (viewport-relative) coordinates and a bounding rect, returns
 * clamped percentage coordinates within that rect.
 *
 * Uses clientX/clientY space to match getBoundingClientRect().
 */
export function clientToQuadrantPercent(clientX: number, clientY: number, rect: DOMRect): { x: number; y: number } {
  const x = ((clientX - rect.left) / rect.width) * 100
  const y = ((clientY - rect.top) / rect.height) * 100
  return {
    x: Math.max(DROP_POSITION_MIN, Math.min(x, DROP_POSITION_MAX)),
    y: Math.max(DROP_POSITION_MIN, Math.min(y, DROP_POSITION_MAX)),
  }
}

/**
 * Given client (viewport-relative) coordinates and the quadrants' bounding
 * rects, returns the quadrant whose box contains the point — carrying that
 * quadrant's canvas rect (falling back to its own) — or null. Pure data in,
 * data out: reading the rects from the DOM is the caller's job.
 */
export function getQuadrantAtPoint(
  clientX: number,
  clientY: number,
  quadrantRects: (DOMRect | null)[],
  canvasRects: (DOMRect | null)[],
): QuadrantTarget | null {
  for (let i = 0; i < quadrantRects.length; i++) {
    const rect = quadrantRects[i]
    if (!rect) continue
    if (clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom) {
      return { index: i, rect: canvasRects[i] ?? rect }
    }
  }
  return null
}

export function addItem(framework: Framework, quadrantIndex: number, item: Item): Framework {
  return {
    ...framework,
    quadrants: framework.quadrants.map((q, i) => (i === quadrantIndex ? { ...q, items: [...q.items, item] } : q)),
  }
}

export function removeItem(framework: Framework, quadrantIndex: number, itemId: string): Framework {
  return {
    ...framework,
    quadrants: framework.quadrants.map((q, i) =>
      i === quadrantIndex ? { ...q, items: q.items.filter((it) => it.id !== itemId) } : q,
    ),
  }
}

export function updateItemText(framework: Framework, quadrantIndex: number, itemId: string, text: string): Framework {
  return {
    ...framework,
    quadrants: framework.quadrants.map((q, i) =>
      i === quadrantIndex ? { ...q, items: q.items.map((it) => (it.id === itemId ? { ...it, text } : it)) } : q,
    ),
  }
}

export function moveItem(
  framework: Framework,
  sourceIndex: number,
  targetIndex: number,
  itemId: string,
  x: number,
  y: number,
): Framework {
  if (sourceIndex === targetIndex) {
    return {
      ...framework,
      quadrants: framework.quadrants.map((q, i) =>
        i === targetIndex ? { ...q, items: q.items.map((it) => (it.id === itemId ? { ...it, x, y } : it)) } : q,
      ),
    }
  }

  const item = framework.quadrants[sourceIndex].items.find((it) => it.id === itemId)
  if (!item) return framework

  return {
    ...framework,
    quadrants: framework.quadrants.map((q, i) => {
      if (i === sourceIndex) {
        return { ...q, items: q.items.filter((it) => it.id !== itemId) }
      }
      if (i === targetIndex) {
        return { ...q, items: [...q.items, { ...item, x, y }] }
      }
      return q
    }),
  }
}

/**
 * The quadrants an item sitting in `sourceIndex` may be moved to — every
 * other quadrant, labelled. One home for the rule, so both grids offer the
 * same targets.
 */
export function moveTargetsFrom(quadrants: Quadrant[], sourceIndex: number): MoveTarget[] {
  return quadrants.map((q, index) => ({ label: q.label, index })).filter((target) => target.index !== sourceIndex)
}

export function setQuadrantColor(framework: Framework, quadrantIndex: number, color: string): Framework {
  return {
    ...framework,
    quadrants: framework.quadrants.map((q, i) => (i === quadrantIndex ? { ...q, color } : q)),
  }
}

export function createItem(text: string, x?: number, y?: number): Item {
  return {
    id: crypto.randomUUID(),
    text,
    x: x ?? Math.random() * 60 + 10,
    y: y ?? Math.random() * 50 + 10,
    createdAt: Date.now(),
  }
}
