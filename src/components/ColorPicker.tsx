import { useState, useRef, useEffect, useCallback } from 'react'
import { colorPresets } from '../colors'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
}

export default function ColorPicker({ color, onChange }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Focus first swatch when popup opens
  useEffect(() => {
    if (open && ref.current) {
      const first = ref.current.querySelector<HTMLElement>('[role="option"]')
      first?.focus()
    }
  }, [open])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const options = ref.current?.querySelectorAll<HTMLElement>('[role="option"]')
      if (!options?.length) return

      const currentIdx = Array.from(options).indexOf(e.target as HTMLElement)

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        const next = (currentIdx + 1) % options.length
        options[next].focus()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = (currentIdx - 1 + options.length) % options.length
        options[prev].focus()
      } else if (e.key === 'Escape' || e.key === 'Tab') {
        e.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    },
    [],
  )

  const currentName = colorPresets.find((c) => c.hex === color)?.name ?? 'Custom'

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        className="w-[18px] h-[18px] rounded border-2 border-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.12)] cursor-pointer transition-transform duration-150 hover:scale-115"
        style={{ background: color }}
        onClick={() => setOpen(!open)}
        aria-label={`Change color (current: ${currentName})`}
        aria-haspopup="listbox"
        aria-expanded={open}
      />
      {open && (
        <div
          className="absolute top-[calc(100%+6px)] right-0 bg-surface border border-border rounded-lg shadow-lg p-2.5 z-[300] w-[180px]"
          role="listbox"
          aria-label="Color options"
          onKeyDown={handleKeyDown}
        >
          <div className="grid grid-cols-5 gap-1.5 mb-2.5">
            {colorPresets.map((c) => (
              <button
                key={c.hex}
                role="option"
                aria-selected={c.hex === color}
                aria-label={c.name}
                className={`w-[26px] h-[26px] rounded-md border-2 cursor-pointer transition-all duration-150 hover:scale-112 ${c.hex === color ? 'border-text shadow-[0_0_0_2px_white,0_0_0_3px_var(--color-text)]' : 'border-transparent'}`}
                style={{ background: c.hex }}
                onClick={() => {
                  onChange(c.hex)
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
