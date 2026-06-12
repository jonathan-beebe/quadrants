import type { Framework, Item } from '../types'

// Canonical envelope for persisted/imported item coordinates, matching the
// widest range the app's own controls can produce (keyboard repositioning).
// Drag-and-drop intentionally places drops in a narrower visual range, but
// any value inside this envelope is valid and must survive a share round-trip.
export const POSITION_MIN = 0
export const POSITION_MAX = 95

export function clampPosition(value: number): number {
  return Math.max(POSITION_MIN, Math.min(value, POSITION_MAX))
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

export function setQuadrantColor(framework: Framework, quadrantIndex: number, color: string): Framework {
  return {
    ...framework,
    quadrants: framework.quadrants.map((q, i) => (i === quadrantIndex ? { ...q, color } : q)),
  }
}
