import { useState, useRef, useCallback, useEffect } from 'react'
import { createItem } from '../storage'
import { deriveColors, defaultColors } from '../colors'
import ColorPicker from './ColorPicker'
import Card, { GhostCard, PLACEHOLDER } from './Card'
import './QuadrantCanvas.css'

export default function QuadrantCanvas({ framework, onUpdate, onReflect, onEdit, onShare }) {
  const [shareStatus, setShareStatus] = useState(null)
  const gridRef = useRef(null)
  const quadrantRefs = useRef([null, null, null, null])
  const canvasRefs = useRef([null, null, null, null])
  const [drag, setDrag] = useState(null)
  const [autoFocusId, setAutoFocusId] = useState(null)

  const updateFramework = useCallback(
    (updater) => {
      const updated = updater(framework)
      onUpdate({ ...updated, updatedAt: Date.now() })
    },
    [framework, onUpdate]
  )

  // Determine which quadrant a page coordinate falls in
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

  // Convert page coords to percentage within a quadrant's content area
  const pageToQuadrantPercent = useCallback((pageX, pageY, rect) => {
    const x = ((pageX - rect.left) / rect.width) * 100
    const y = ((pageY - rect.top) / rect.height) * 100
    return {
      x: Math.max(2, Math.min(x, 85)),
      y: Math.max(2, Math.min(y, 85)),
    }
  }, [])

  // Pointer move/up handlers attached to window during drag
  useEffect(() => {
    if (!drag) return

    const handleMove = (e) => {
      setDrag((prev) => prev ? { ...prev, x: e.pageX, y: e.pageY } : null)
    }

    const handleUp = (e) => {
      setDrag((prev) => {
        if (!prev) return null
        const target = getQuadrantAtPoint(e.pageX, e.pageY)
        if (!target) return null // dropped outside — cancel

        const { x, y } = pageToQuadrantPercent(
          e.pageX - prev.grabX,
          e.pageY - prev.grabY,
          target.rect
        )

        updateFramework((fw) => {
          const newQuadrants = fw.quadrants.map((q, i) => {
            if (i === prev.sourceIdx && prev.sourceIdx !== target.index) {
              return { ...q, items: q.items.filter((it) => it.id !== prev.itemId) }
            }
            return q
          })

          // Update position (and move to target quadrant if different)
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
    setDrag({
      itemId: item.id,
      sourceIdx: quadrantIdx,
      grabX: info.grabX,
      grabY: info.grabY,
      width: info.width,
      height: info.height,
      x: info.pageX,
      y: info.pageY,
    })
  }, [])

  const handleAddItem = useCallback(
    (quadrantIdx) => {
      const newItem = createItem(PLACEHOLDER)
      setAutoFocusId(newItem.id)
      updateFramework((fw) => ({
        ...fw,
        quadrants: fw.quadrants.map((q, i) =>
          i === quadrantIdx
            ? { ...q, items: [...q.items, newItem] }
            : q
        ),
      }))
    },
    [updateFramework]
  )

  const handleDeleteItem = useCallback(
    (quadrantIdx, itemId) => {
      updateFramework((fw) => ({
        ...fw,
        quadrants: fw.quadrants.map((q, i) =>
          i === quadrantIdx
            ? { ...q, items: q.items.filter((it) => it.id !== itemId) }
            : q
        ),
      }))
    },
    [updateFramework]
  )

  const handleEditItem = useCallback(
    (quadrantIdx, itemId, text) => {
      updateFramework((fw) => ({
        ...fw,
        quadrants: fw.quadrants.map((q, i) =>
          i === quadrantIdx
            ? { ...q, items: q.items.map((it) => (it.id === itemId ? { ...it, text } : it)) }
            : q
        ),
      }))
    },
    [updateFramework]
  )

  const handleColorChange = useCallback(
    (quadrantIdx, color) => {
      updateFramework((fw) => ({
        ...fw,
        quadrants: fw.quadrants.map((q, i) =>
          i === quadrantIdx ? { ...q, color } : q
        ),
      }))
    },
    [updateFramework]
  )

  // Find the dragged item for the ghost
  let draggedItem = null
  if (drag) {
    const q = framework.quadrants[drag.sourceIdx]
    draggedItem = q?.items.find((it) => it.id === drag.itemId)
  }

  return (
    <div className="canvas">
      <div className="canvas__header">
        <div className="canvas__title-group">
          <h1 className="canvas__title">{framework.name}</h1>
          <button className="btn btn--ghost btn--sm" onClick={onEdit} title="Edit framework">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        </div>
        <div className="canvas__header-actions">
          <button
            className="btn btn--secondary btn--sm"
            onClick={async () => {
              try {
                await onShare()
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
          <button className="btn btn--secondary btn--sm" onClick={onReflect}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
            Reflect
          </button>
        </div>
      </div>

      <div className="canvas__grid-wrapper">
        {framework.axisY && (
          <div className="canvas__axis-y">
            <span>{framework.axisY}</span>
          </div>
        )}
        <div className="canvas__grid" ref={gridRef}>
          {framework.quadrants.map((quadrant, idx) => {
            const qColor = quadrant.color || defaultColors[idx]
            const { bg, border } = deriveColors(qColor)
            return (
            <div
              key={idx}
              className="quadrant"
              style={{ background: bg, borderColor: border }}
              ref={(el) => (quadrantRefs.current[idx] = el)}
            >
              <div className="quadrant__header">
                <h3 className="quadrant__title">{quadrant.label}</h3>
                <div className="quadrant__header-actions">
                  <ColorPicker color={qColor} onChange={(c) => handleColorChange(idx, c)} />
                  <span className="quadrant__count">{quadrant.items.length}</span>
                  <button
                    className="quadrant__add-btn"
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

              <div className="quadrant__canvas" ref={(el) => (canvasRefs.current[idx] = el)}>
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
          <div className="canvas__axis-x">
            <span>{framework.axisX}</span>
          </div>
        )}
      </div>

      {drag && draggedItem && <GhostCard drag={drag} text={draggedItem.text} />}
    </div>
  )
}
