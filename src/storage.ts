import { defaultColors } from './colors'
import { sanitizeStoredFrameworks } from './logic/framework'
import type { Framework, FrameworkTemplate, Item } from './types'

const STORAGE_KEY = 'quadrants_frameworks'

export function loadFrameworks(): Framework[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    return sanitizeStoredFrameworks(JSON.parse(data))
  } catch {
    return []
  }
}

export function saveFrameworks(frameworks: Framework[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(frameworks))
    return true
  } catch (e) {
    console.error('Failed to save frameworks to localStorage:', e)
    return false
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

export function createItem(text: string, x?: number, y?: number): Item {
  return {
    id: crypto.randomUUID(),
    text,
    x: x ?? Math.random() * 60 + 10,
    y: y ?? Math.random() * 50 + 10,
    createdAt: Date.now(),
  }
}
