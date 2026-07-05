import { filterValidFrameworks } from './logic/framework'
import type { Framework } from './types'

const STORAGE_KEY = 'quadrants_frameworks'

export function loadFrameworks(): Framework[] {
  try {
    const storedJson = localStorage.getItem(STORAGE_KEY)
    if (!storedJson) return []
    return filterValidFrameworks(JSON.parse(storedJson))
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
