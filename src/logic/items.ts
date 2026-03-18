import type { Framework, Item, Quadrant } from '../types'

export function addItem(
  framework: Framework,
  quadrantIndex: number,
  item: Item,
): Framework {
  return {
    ...framework,
    quadrants: framework.quadrants.map((q, i) =>
      i === quadrantIndex ? { ...q, items: [...q.items, item] } : q,
    ),
  }
}

export function removeItem(
  framework: Framework,
  quadrantIndex: number,
  itemId: string,
): Framework {
  return {
    ...framework,
    quadrants: framework.quadrants.map((q, i) =>
      i === quadrantIndex
        ? { ...q, items: q.items.filter((it) => it.id !== itemId) }
        : q,
    ),
  }
}

export function updateItemText(
  framework: Framework,
  quadrantIndex: number,
  itemId: string,
  text: string,
): Framework {
  return {
    ...framework,
    quadrants: framework.quadrants.map((q, i) =>
      i === quadrantIndex
        ? { ...q, items: q.items.map((it) => (it.id === itemId ? { ...it, text } : it)) }
        : q,
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
        i === targetIndex
          ? { ...q, items: q.items.map((it) => (it.id === itemId ? { ...it, x, y } : it)) }
          : q,
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

export function setQuadrantColor(
  framework: Framework,
  quadrantIndex: number,
  color: string,
): Framework {
  return {
    ...framework,
    quadrants: framework.quadrants.map((q, i) =>
      i === quadrantIndex ? { ...q, color } : q,
    ),
  }
}
