import type { Framework, SharedPayload } from '../types'

/** Project a Framework into the wire shape: ids/timestamps stripped from items. */
export function toSharedPayload(framework: Framework): SharedPayload {
  return {
    id: framework.id,
    name: framework.name,
    axisX: framework.axisX,
    axisY: framework.axisY,
    quadrants: framework.quadrants.map((q) => ({
      label: q.label,
      color: q.color,
      items: q.items.map((it) => ({ text: it.text, x: it.x, y: it.y })),
    })),
  }
}

export function isValidPayload(p: unknown): p is SharedPayload {
  if (typeof p !== 'object' || p === null) return false
  const obj = p as Record<string, unknown>
  if (typeof obj.id !== 'string' || !obj.id) return false
  if (typeof obj.name !== 'string' || !obj.name) return false
  if (!Array.isArray(obj.quadrants) || obj.quadrants.length !== 4) return false
  return obj.quadrants.every((q: unknown) => {
    if (typeof q !== 'object' || q === null) return false
    const quad = q as Record<string, unknown>
    if (typeof quad.label !== 'string') return false
    if (quad.color !== undefined && typeof quad.color !== 'string') return false
    if (quad.items !== undefined && !Array.isArray(quad.items)) return false
    const items = (quad.items as unknown[] | undefined) ?? []
    return items.every((it: unknown) => {
      if (typeof it !== 'object' || it === null) return false
      const item = it as Record<string, unknown>
      return typeof item.text === 'string' && typeof item.x === 'number' && typeof item.y === 'number'
    })
  })
}

/**
 * The share link (RFCTR-012): the app's URL — origin plus deploy base — with
 * the encoded payload in the fragment. The shell supplies origin and base;
 * base arrives with its trailing slash (Vite guarantees one).
 */
export function composeShareUrl(origin: string, base: string, hash: string): string {
  return `${origin}${base}#${hash}`
}
