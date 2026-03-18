import { useState, useRef, useEffect } from 'react'
import { colorPresets } from '../colors'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        className="w-[18px] h-[18px] rounded border-2 border-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.12)] cursor-pointer transition-transform duration-150 hover:scale-115"
        style={{ background: color }}
        onClick={() => setOpen(!open)}
        title="Change color"
      />
      {open && (
        <div className="absolute top-[calc(100%+6px)] right-0 bg-surface border border-border rounded-lg shadow-lg p-2.5 z-[300] w-[180px]">
          <div className="grid grid-cols-5 gap-1.5 mb-2.5">
            {colorPresets.map((c) => (
              <button
                key={c}
                className={`w-[26px] h-[26px] rounded-md border-2 cursor-pointer transition-all duration-150 hover:scale-112 ${c === color ? 'border-text shadow-[0_0_0_2px_white,0_0_0_3px_var(--color-text)]' : 'border-transparent'}`}
                style={{ background: c }}
                onClick={() => {
                  onChange(c)
                  setOpen(false)
                }}
              />
            ))}
          </div>
          <label className="flex items-center justify-between text-xs text-text-secondary border-t border-border pt-2">
            <span>Custom</span>
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="w-7 h-[22px] border border-border rounded cursor-pointer p-0 bg-transparent"
            />
          </label>
        </div>
      )}
    </div>
  )
}
