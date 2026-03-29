import { defaultColors } from '../colors'
import type { Framework, FrameworkTemplate, SharedPayload } from '../types'

export function hydratePayload(payload: SharedPayload, id: string): Framework {
  return {
    id,
    name: payload.name,
    axisX: payload.axisX || '',
    axisY: payload.axisY || '',
    quadrants: payload.quadrants.map((q, i) => ({
      label: q.label,
      color: q.color || defaultColors[i],
      items: (q.items || []).map((it) => ({
        id: crypto.randomUUID(),
        text: it.text,
        x: Math.max(2, Math.min(it.x ?? 10, 85)),
        y: Math.max(2, Math.min(it.y ?? 10, 85)),
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

export function frameworksMatch(existing: Framework, payload: SharedPayload): boolean {
  return (
    existing.name === payload.name &&
    existing.axisX === (payload.axisX || '') &&
    existing.axisY === (payload.axisY || '') &&
    existing.quadrants.every((q, i) => {
      const pq = payload.quadrants[i]
      if (!pq) return false
      if (q.label !== pq.label) return false
      const pqItems = pq.items ?? []
      if (q.items.length !== pqItems.length) return false
      return q.items.every(
        (item, j) => item.text === pqItems[j]?.text && item.x === pqItems[j]?.x && item.y === pqItems[j]?.y,
      )
    })
  )
}

export function duplicateAsImport(fw: Framework): Framework {
  return {
    ...fw,
    id: crypto.randomUUID(),
    name: `${fw.name} (imported)`,
  }
}

export function replaceFramework(frameworks: Framework[], incoming: Framework): Framework[] {
  return frameworks.map((f) => (f.id === incoming.id ? incoming : f))
}
