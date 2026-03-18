import type { DerivedColors } from './types'

export const defaultColors: string[] = ['#fbbf24', '#60a5fa', '#34d399', '#f472b6']

export const colorPresets: { hex: string; name: string }[] = [
  { hex: '#fbbf24', name: 'Amber' },
  { hex: '#f97316', name: 'Orange' },
  { hex: '#ef4444', name: 'Red' },
  { hex: '#f472b6', name: 'Pink' },
  { hex: '#a78bfa', name: 'Violet' },
  { hex: '#60a5fa', name: 'Blue' },
  { hex: '#34d399', name: 'Emerald' },
  { hex: '#4ade80', name: 'Green' },
  { hex: '#a3e635', name: 'Lime' },
  { hex: '#94a3b8', name: 'Slate' },
]

export function deriveColors(hex: string): DerivedColors {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.08)`,
    border: `rgba(${r}, ${g}, ${b}, 0.4)`,
    accent: hex,
  }
}
