import { useState, useRef, useEffect } from 'react'
import { colorPresets } from '../colors'
import { useClickOutside } from '../hooks/useClickOutside'
import { useMenuKeyboardNav } from '../hooks/useMenuKeyboardNav'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  placement?: 'auto' | 'above-center'
}

export default function ColorPicker({ color, onChange, placement = 'auto' }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [alignLeft, setAlignLeft] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const close = () => setOpen(false)
  useClickOutside(ref, close, open)

  const handleKeyDown = useMenuKeyboardNav(ref, close, triggerRef)

  useEffect(() => {
    if (open && ref.current) {
      const first = ref.current.querySelector<HTMLElement>('[role="option"]')
      first?.focus()
    }
  }, [open])

  const currentName = colorPresets.find((c) => c.hex === color)?.name ?? 'Custom'

  return (
    <div className="relative" ref={ref}>
      <button
        ref={triggerRef}
        className="w-[24px] h-[24px] rounded border-2 border-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.12)] cursor-pointer transition-transform duration-150 hover:scale-115"
        style={{ background: color }}
        onClick={() => {
          if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setAlignLeft(rect.left < window.innerWidth / 2)
          }
          setOpen(!open)
        }}
        aria-label={`Change color (current: ${currentName})`}
        aria-haspopup="listbox"
        aria-expanded={open}
      />
      {open && (
        <div
          className={`absolute bg-surface border border-border rounded-lg shadow-lg p-2.5 z-[300] w-[180px] ${placement === 'above-center' ? 'bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2' : `top-[calc(100%+6px)] ${alignLeft ? 'left-0' : 'right-0'}`}`}
          role="listbox"
          aria-label="Color options"
          onKeyDown={handleKeyDown}>
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
