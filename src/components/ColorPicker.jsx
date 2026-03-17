import { useState, useRef, useEffect } from 'react'
import { colorPresets } from '../colors'
import './ColorPicker.css'

export default function ColorPicker({ color, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="color-picker" ref={ref}>
      <button
        className="color-picker__swatch"
        style={{ background: color }}
        onClick={() => setOpen(!open)}
        title="Change color"
      />
      {open && (
        <div className="color-picker__popover">
          <div className="color-picker__presets">
            {colorPresets.map((c) => (
              <button
                key={c}
                className={`color-picker__preset ${c === color ? 'color-picker__preset--active' : ''}`}
                style={{ background: c }}
                onClick={() => {
                  onChange(c)
                  setOpen(false)
                }}
              />
            ))}
          </div>
          <label className="color-picker__custom">
            <span>Custom</span>
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
            />
          </label>
        </div>
      )}
    </div>
  )
}
