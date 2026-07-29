import { defaultColors, isValidHexColor } from '../colors'
import { clampPosition } from './items'
import type { Framework, FrameworkTemplate, Item, Quadrant, SharedPayload } from '../types'

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

function isValidItem(it: unknown): it is Item {
  return (
    isRecord(it) &&
    typeof it.id === 'string' &&
    typeof it.text === 'string' &&
    typeof it.x === 'number' &&
    typeof it.y === 'number'
  )
}

function isValidQuadrant(q: unknown): q is Quadrant {
  return (
    isRecord(q) &&
    typeof q.label === 'string' &&
    typeof q.color === 'string' &&
    Array.isArray(q.items) &&
    q.items.every(isValidItem)
  )
}

function isValidFramework(fw: unknown): fw is Framework {
  return (
    isRecord(fw) &&
    typeof fw.id === 'string' &&
    typeof fw.name === 'string' &&
    Array.isArray(fw.quadrants) &&
    fw.quadrants.length === 4 &&
    fw.quadrants.every(isValidQuadrant)
  )
}

/**
 * Validate frameworks parsed from persistent storage. Frameworks with
 * malformed quadrant internals are dropped wholesale — stored ids and
 * timestamps must stay stable across loads, so repair (as the import
 * path does) is not an option here.
 */
export function filterValidFrameworks(parsed: unknown): Framework[] {
  if (!Array.isArray(parsed)) return []
  return parsed.filter(isValidFramework)
}

export function frameworkFromPayload(payload: SharedPayload, id: string): Framework {
  return {
    id,
    name: payload.name,
    axisX: payload.axisX || '',
    axisY: payload.axisY || '',
    quadrants: payload.quadrants.map((q, i) => ({
      label: q.label,
      color: isValidHexColor(q.color) ? q.color : defaultColors[i],
      items: (q.items || []).map((it) => ({
        id: crypto.randomUUID(),
        text: it.text,
        x: clampPosition(it.x ?? 10),
        y: clampPosition(it.y ?? 10),
        createdAt: Date.now(),
      })),
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function updateFramework(frameworks: Framework[], updated: Framework): Framework[] {
  return frameworks.map((f) => (f.id === updated.id ? { ...updated, updatedAt: Date.now() } : f))
}

export function deleteFramework(frameworks: Framework[], id: string): Framework[] {
  return frameworks.filter((f) => f.id !== id)
}

export function duplicateFramework(fw: Framework): Framework {
  return {
    ...JSON.parse(JSON.stringify(fw)),
    id: crypto.randomUUID(),
    name: `${fw.name} (copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function applyTemplateEdit(fw: Framework, template: FrameworkTemplate): Framework {
  return {
    ...fw,
    name: template.name,
    axisX: template.axisX || '',
    axisY: template.axisY || '',
    quadrants: fw.quadrants.map((q, i) => ({
      ...q,
      label: template.quadrants[i],
    })),
    updatedAt: Date.now(),
  }
}

export function frameworkMatchesPayload(existing: Framework, payload: SharedPayload): boolean {
  return (
    existing.name === payload.name &&
    existing.axisX === (payload.axisX || '') &&
    existing.axisY === (payload.axisY || '') &&
    existing.quadrants.every((q, i) => {
      const pq = payload.quadrants[i]
      if (!pq) return false
      if (q.label !== pq.label) return false
      if ((q.color || '') !== (pq.color || '')) return false
      const pqItems = pq.items ?? []
      if (q.items.length !== pqItems.length) return false
      // Compare against what frameworkFromPayload would store (clamped), not the raw
      // payload values — otherwise re-importing the same link reports a
      // false conflict whenever the payload holds out-of-range coordinates.
      return q.items.every(
        (item, j) =>
          pqItems[j] !== undefined &&
          item.text === pqItems[j].text &&
          item.x === clampPosition(pqItems[j].x ?? 10) &&
          item.y === clampPosition(pqItems[j].y ?? 10),
      )
    })
  )
}

export function duplicateAsImport(fw: Framework): Framework {
  const clone = structuredClone(fw)
  clone.id = crypto.randomUUID()
  clone.name = `${fw.name} (imported)`
  return clone
}

export function replaceFramework(frameworks: Framework[], incoming: Framework): Framework[] {
  return frameworks.map((f) => (f.id === incoming.id ? incoming : f))
}

/**
 * Repair a parsed JSON object into a valid Framework, filling in missing
 * or invalid fields with safe defaults. Returns null if the input is not
 * salvageable (missing name or not exactly 4 quadrants).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function repairImportedFramework(raw: any): Framework | null {
  if (!raw || typeof raw !== 'object') return null
  if (typeof raw.name !== 'string' || !raw.name.trim()) return null
  if (!Array.isArray(raw.quadrants) || raw.quadrants.length !== 4) return null

  return {
    id: crypto.randomUUID(),
    name: raw.name,
    axisX: typeof raw.axisX === 'string' ? raw.axisX : '',
    axisY: typeof raw.axisY === 'string' ? raw.axisY : '',
    quadrants: raw.quadrants.map((q: unknown, i: number) => {
      const qObj = q && typeof q === 'object' ? (q as Record<string, unknown>) : {}
      const rawItems = Array.isArray(qObj.items) ? qObj.items : []
      return {
        label: typeof qObj.label === 'string' ? qObj.label : `Quadrant ${i + 1}`,
        color: isValidHexColor(qObj.color) ? qObj.color : defaultColors[i],
        items: rawItems
          .filter(
            (it: unknown) => it && typeof it === 'object' && typeof (it as Record<string, unknown>).text === 'string',
          )
          .map((it: unknown) => {
            const item = it as Record<string, unknown>
            return {
              id: typeof item.id === 'string' && item.id ? item.id : crypto.randomUUID(),
              text: item.text as string,
              x: typeof item.x === 'number' ? item.x : 10,
              y: typeof item.y === 'number' ? item.y : 10,
              createdAt: typeof item.createdAt === 'number' ? item.createdAt : Date.now(),
            }
          }),
      }
    }),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function createFramework(template: FrameworkTemplate): Framework {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name: template.name,
    axisX: template.axisX || '',
    axisY: template.axisY || '',
    quadrants: template.quadrants.map((label, i) => ({
      label,
      color: template.colors?.[i] || defaultColors[i],
      items: [],
    })),
    createdAt: now,
    updatedAt: now,
  }
}

/**
 * Download filename for an exported framework (RFCTR-012): strip characters
 * that are illegal on any mainstream platform, collapse whitespace to
 * hyphens, lowercase, and never yield an empty name — the browser's download
 * sanitization varies too much to lean on.
 */
export function exportFilename(name: string): string {
  const slug = name
    // eslint-disable-next-line no-control-regex
    .replace(/[/\\:*?"<>|\u0000-\u001f]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .toLowerCase()
  return `${slug || 'framework'}.json`
}
