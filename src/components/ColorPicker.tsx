import { useState, useRef, useEffect, useCallback } from 'react'
import { colorPresets, deriveColors } from '../colors'
import { useClickOutside } from '../hooks/useClickOutside'

interface ColorPickerProps {
  color: string
  onChange: (color: string) => void
  placement?: 'auto' | 'above-center'
  size?: 'sm' | 'md'
}

export default function ColorPicker({ color, onChange, placement = 'auto', size = 'md' }: ColorPickerProps) {
  const [open, setOpen] = useState(false)
  const [alignLeft, setAlignLeft] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const close = () => setOpen(false)
  useClickOutside(pickerRef, close, open)

  // Custom keyboard model (A11Y-013): arrows cycle the preset options, Tab
  // toggles between the option grid and the custom color input (it must be
  // reachable — Tab-closes would lock keyboard users out of it), Escape
  // closes and restores focus to the trigger. useMenuKeyboardNav is not
  // used here: its menu semantics (Tab closes) are right for menus only.
  const customInputRef = useRef<HTMLInputElement>(null)
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (e.key === 'Tab') {
      e.preventDefault()
      if (e.target === customInputRef.current) {
        const options = pickerRef.current?.querySelectorAll<HTMLElement>('[role="option"]')
        options?.[0]?.focus()
      } else {
        customInputRef.current?.focus()
      }
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      const options = pickerRef.current?.querySelectorAll<HTMLElement>('[role="option"]')
      if (!options?.length) return
      const currentIdx = Array.from(options).indexOf(e.target as HTMLElement)
      if (currentIdx === -1) return
      e.preventDefault()
      const forward = e.key === 'ArrowDown' || e.key === 'ArrowRight'
      const nextIdx = (currentIdx + (forward ? 1 : -1) + options.length) % options.length
      options[nextIdx].focus()
    }
  }, [])

  useEffect(() => {
    if (open && pickerRef.current) {
      const first = pickerRef.current.querySelector<HTMLElement>('[role="option"]')
      first?.focus()
    }
  }, [open])

  const currentName = colorPresets.find((c) => c.hex === color)?.name ?? 'Custom'

  return (
    <div className="relative" ref={pickerRef}>
      <button
        ref={triggerRef}
        className="group inline-grid place-items-center w-6 h-6 cursor-pointer focus:outline-none"
        onClick={() => {
          if (!open && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect()
            setAlignLeft(rect.left < window.innerWidth / 2)
          }
          setOpen(!open)
        }}
        aria-label={`Change color (current: ${currentName})`}
        aria-haspopup="dialog"
        aria-expanded={open}>
        <span
          aria-hidden="true"
          className={`block rounded border-white/80 shadow-[0_0_0_1px_rgba(0,0,0,0.12)] transition-transform duration-150 group-hover:scale-115 group-focus-visible:outline group-focus-visible:outline-2 group-focus-visible:outline-offset-2 ${
            size === 'sm' ? 'w-[14px] h-[14px] border' : 'w-[24px] h-[24px] border-2'
          }`}
          style={{ background: color }}
        />
      </button>
      {open && (
        <div
          className={`absolute bg-surface border border-border rounded-lg shadow-lg p-2.5 z-[300] w-[180px] ${placement === 'above-center' ? 'bottom-[calc(100%+6px)] left-1/2 -translate-x-1/2' : `top-[calc(100%+6px)] ${alignLeft ? 'left-0' : 'right-0'}`}`}
          role="dialog"
          aria-label="Choose a color"
          onKeyDown={handleKeyDown}>
          <div role="listbox" aria-label="Color presets" className="grid grid-cols-5 gap-1.5 mb-2.5">
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
                  triggerRef.current?.focus()
                }}
              />
            ))}
          </div>
          <label className="flex items-center justify-between text-xs text-text-secondary border-t border-border pt-2">
            <span>Custom</span>
            <input
              ref={customInputRef}
              type="color"
              value={deriveColors(color).accent}
              onChange={(e) => onChange(e.target.value)}
              className="w-7 h-6 border border-border rounded cursor-pointer p-0 bg-transparent"
            />
          </label>
        </div>
      )}
    </div>
  )
}
