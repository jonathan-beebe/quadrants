import { useState, useRef, useCallback, useEffect } from 'react'
import { createItem } from '../storage'
import { deriveColors, defaultColors } from '../colors'
import ColorPicker from './ColorPicker'
import Card, { GhostCard, PLACEHOLDER } from './Card'

export default function QuadrantCanvas({ framework, sidebarOpen, onUpdate, onReflect, onEdit, onShare }) {
  const [shareStatus, setShareStatus] = useState(null)
  const gridRef = useRef(null)
  const quadrantRefs = useRef([null, null, null, null])
  const canvasRefs = useRef([null, null, null, null])
  const [drag, setDrag] = useState(null)
  const [autoFocusId, setAutoFocusId] = useState(null)

  const frameworkRef = useRef(framework)
  frameworkRef.current = framework

  const updateFramework = useCallback(
    (updater) => {
      const updated = updater(frameworkRef.current)
      onUpdate({ ...updated, updatedAt: Date.now() })
    },
    [onUpdate]
  )

  const getQuadrantAtPoint = useCallback((pageX, pageY) => {
    for (let i = 0; i < 4; i++) {
      const el = quadrantRefs.current[i]
      if (!el) continue
      const rect = el.getBoundingClientRect()
      if (pageX >= rect.left && pageX <= rect.right && pageY >= rect.top && pageY <= rect.bottom) {
        const canvasRect = canvasRefs.current[i]?.getBoundingClientRect() || rect
        return { index: i, rect: canvasRect }
      }
    }
    return null
  }, [])

  const pageToQuadrantPercent = useCallback((pageX, pageY, rect) => {
    const x = ((pageX - rect.left) / rect.width) * 100
    const y = ((pageY - rect.top) / rect.height) * 100
    return { x: Math.max(2, Math.min(x, 85)), y: Math.max(2, Math.min(y, 85)) }
  }, [])

  useEffect(() => {
    if (!drag) return
    const handleMove = (e) => {
      setDrag((prev) => prev ? { ...prev, x: e.pageX, y: e.pageY } : null)
    }
    const handleUp = (e) => {
      setDrag((prev) => {
        if (!prev) return null
        const target = getQuadrantAtPoint(e.pageX, e.pageY)
        if (!target) return null
        const { x, y } = pageToQuadrantPercent(e.pageX - prev.grabX, e.pageY - prev.grabY, target.rect)
        updateFramework((fw) => {
          const newQuadrants = fw.quadrants.map((q, i) => {
            if (i === prev.sourceIdx && prev.sourceIdx !== target.index) {
              return { ...q, items: q.items.filter((it) => it.id !== prev.itemId) }
            }
            return q
          })
          if (prev.sourceIdx === target.index) {
            newQuadrants[target.index] = {
              ...newQuadrants[target.index],
              items: newQuadrants[target.index].items.map((it) =>
                it.id === prev.itemId ? { ...it, x, y } : it
              ),
            }
          } else {
            const item = fw.quadrants[prev.sourceIdx].items.find((it) => it.id === prev.itemId)
            if (item) {
              newQuadrants[target.index] = {
                ...newQuadrants[target.index],
                items: [...newQuadrants[target.index].items, { ...item, x, y }],
              }
            }
          }
          return { ...fw, quadrants: newQuadrants }
        })
        return null
      })
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [drag, getQuadrantAtPoint, pageToQuadrantPercent, updateFramework])

  const handleDragStart = useCallback((quadrantIdx, item, info) => {
    setDrag({ itemId: item.id, sourceIdx: quadrantIdx, grabX: info.grabX, grabY: info.grabY, width: info.width, height: info.height, x: info.pageX, y: info.pageY })
  }, [])

  const handleAddItem = useCallback((quadrantIdx) => {
    const newItem = createItem(PLACEHOLDER)
    setAutoFocusId(newItem.id)
    updateFramework((fw) => ({
      ...fw,
      quadrants: fw.quadrants.map((q, i) => i === quadrantIdx ? { ...q, items: [...q.items, newItem] } : q),
    }))
  }, [updateFramework])

  const handleDeleteItem = useCallback((quadrantIdx, itemId) => {
    updateFramework((fw) => ({
      ...fw,
      quadrants: fw.quadrants.map((q, i) => i === quadrantIdx ? { ...q, items: q.items.filter((it) => it.id !== itemId) } : q),
    }))
  }, [updateFramework])

  const handleEditItem = useCallback((quadrantIdx, itemId, text) => {
    updateFramework((fw) => ({
      ...fw,
      quadrants: fw.quadrants.map((q, i) => i === quadrantIdx ? { ...q, items: q.items.map((it) => (it.id === itemId ? { ...it, text } : it)) } : q),
    }))
  }, [updateFramework])

  const handleColorChange = useCallback((quadrantIdx, color) => {
    updateFramework((fw) => ({
      ...fw,
      quadrants: fw.quadrants.map((q, i) => i === quadrantIdx ? { ...q, color } : q),
    }))
  }, [updateFramework])

  let draggedItem = null
  if (drag) {
    const q = framework.quadrants[drag.sourceIdx]
    draggedItem = q?.items.find((it) => it.id === drag.itemId)
  }

  return (
    <div className="flex flex-col h-screen p-6 select-none">
      <div className={`flex items-center justify-between mb-5 shrink-0 ${sidebarOpen ? '' : 'pl-12'}`}>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold">{framework.name}</h1>
          <button className="btn-ghost btn-sm" onClick={onEdit} title="Edit framework">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary btn-sm"
            onClick={async () => {
              try {
                await onShare(framework)
                setShareStatus('copied')
                setTimeout(() => setShareStatus(null), 2000)
              } catch {
                setShareStatus('error')
                setTimeout(() => setShareStatus(null), 2000)
              }
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
            {shareStatus === 'copied' ? 'Link copied!' : 'Share'}
          </button>
          <button className="btn-secondary btn-sm" onClick={onReflect}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
            Reflect
          </button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 relative">
        {framework.axisY && (
          <div className="flex items-center justify-center shrink-0 w-6">
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider -rotate-90 whitespace-nowrap">{framework.axisY}</span>
          </div>
        )}
        <div className="flex-1 flex flex-col min-h-0">
        <div className="grid grid-cols-2 grid-rows-2 gap-3 flex-1 min-h-0" ref={gridRef}>
          {framework.quadrants.map((quadrant, idx) => {
            const qColor = quadrant.color || defaultColors[idx]
            const { bg, border } = deriveColors(qColor)
            return (
              <div
                key={idx}
                className="flex flex-col rounded-xl border overflow-visible transition-[border-color] duration-150"
                style={{ background: bg, borderColor: border }}
                ref={(el) => (quadrantRefs.current[idx] = el)}
              >
                <div className="flex items-center justify-between px-3.5 pt-2.5 pb-1.5 shrink-0">
                  <h3 className="text-[13px] font-semibold">{quadrant.label}</h3>
                  <div className="flex items-center gap-1.5">
                    <ColorPicker color={qColor} onChange={(c) => handleColorChange(idx, c)} />
                    <span className="text-[11px] text-text-tertiary bg-black/6 dark:bg-white/10 px-[7px] py-px rounded-full">{quadrant.items.length}</span>
                    <button
                      className="p-[3px] rounded text-text-tertiary transition-all duration-150 hover:text-text-secondary hover:bg-black/6 dark:hover:bg-white/10"
                      onClick={() => handleAddItem(idx)}
                      title="Add item"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex-1 relative min-h-0 overflow-visible" ref={(el) => (canvasRefs.current[idx] = el)}>
                  {quadrant.items.map((item) => (
                    <Card
                      key={item.id}
                      item={item}
                      isDragging={drag?.itemId === item.id}
                      autoFocus={autoFocusId === item.id}
                      onChange={(text) => handleEditItem(idx, item.id, text)}
                      onDelete={() => handleDeleteItem(idx, item.id)}
                      onDragStart={(info) => handleDragStart(idx, item, info)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
        {framework.axisX && (
          <div className="text-center pt-2 shrink-0">
            <span className="text-xs font-medium text-text-tertiary uppercase tracking-wider">{framework.axisX}</span>
          </div>
        )}
        </div>
      </div>

      {drag && draggedItem && <GhostCard drag={drag} text={draggedItem.text} />}
    </div>
  )
}
