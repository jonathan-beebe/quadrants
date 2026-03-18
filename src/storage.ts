import { defaultColors } from './colors'
import type { Framework, FrameworkTemplate, Item } from './types'

const STORAGE_KEY = 'quadrants_frameworks'

export function loadFrameworks(): Framework[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveFrameworks(frameworks: Framework[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(frameworks))
}

export function createFramework(template: FrameworkTemplate): Framework {
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
    createdAt: Date.now(),
    updatedAt: Date.now(),
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
