export interface Item {
  id: string
  text: string
  x: number
  y: number
  createdAt: number
}

export interface Quadrant {
  label: string
  color: string
  items: Item[]
}

export interface Framework {
  id: string
  name: string
  axisX: string
  axisY: string
  quadrants: Quadrant[]
  createdAt: number
  updatedAt: number
}

export interface FrameworkTemplate {
  name: string
  axisX: string
  axisY: string
  quadrants: string[]
  colors?: string[]
}

export interface SharedPayload {
  name: string
  axisX: string
  axisY: string
  quadrants: {
    label: string
    color: string
    items: { text: string; x: number; y: number }[]
  }[]
}

export interface DerivedColors {
  bg: string
  border: string
  accent: string
}
