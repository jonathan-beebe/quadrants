const STORAGE_KEY = 'quadrants_frameworks'

export function loadFrameworks() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveFrameworks(frameworks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(frameworks))
}

export function createFramework(template) {
  return {
    id: crypto.randomUUID(),
    name: template.name,
    axisX: template.axisX || '',
    axisY: template.axisY || '',
    quadrants: template.quadrants.map((label) => ({
      label,
      items: [],
    })),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function createItem(text) {
  return {
    id: crypto.randomUUID(),
    text,
    createdAt: Date.now(),
  }
}
