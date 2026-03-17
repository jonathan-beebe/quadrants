// Default quadrant colors
export const defaultColors = ['#fbbf24', '#60a5fa', '#34d399', '#f472b6']

// Preset palette for the color picker
export const colorPresets = [
  '#fbbf24', // amber
  '#f97316', // orange
  '#ef4444', // red
  '#f472b6', // pink
  '#a78bfa', // violet
  '#60a5fa', // blue
  '#34d399', // emerald
  '#4ade80', // green
  '#a3e635', // lime
  '#94a3b8', // slate
]

// Derive background and border colors from a base color
export function deriveColors(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return {
    bg: `rgba(${r}, ${g}, ${b}, 0.08)`,
    border: `rgba(${r}, ${g}, ${b}, 0.4)`,
    accent: hex,
  }
}
