import { useState, useRef, useCallback, useEffect } from 'react'
import { createItem } from '../storage'
import { deriveColors, defaultColors } from '../colors'
import ColorPicker from './ColorPicker'
import './QuadrantCanvas.css'

export default function QuadrantCanvas({ framework, onUpdate, onReflect, onEdit }) {
  const gridRef = useRef(null)
  const quadrantRefs = useRef([null, null, null, null])
  const canvasRefs = useRef([null, null, null, null])
  const [drag, setDrag] = useState(null) // { itemId, sourceIdx, offsetX, offsetY, x, y }
  const [editingItem, setEditingItem] = useState(null) // { quadrantIdx, itemId }
  const [editText, setEditText] = useState('')
  const [addingQuadrant, setAddingQuadrant] = useState(null)
  const [addText, setAddText] = useState('')
  const addInputRef = useRef(null)

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

  const handlePointerDown = useCallback((e, quadrantIdx, item) => {
    if (e.button !== 0) return
    e.preventDefault()
    const cardEl = e.currentTarget
    const cardRect = cardEl.getBoundingClientRect()
    setDrag({
      itemId: item.id,
      sourceIdx: quadrantIdx,
      grabX: e.pageX - cardRect.left,
      grabY: e.pageY - cardRect.top,
      width: cardRect.width,
      height: cardRect.height,
      x: e.pageX,
      y: e.pageY,
    })
  }, [])

  const handleAddItem = useCallback(
    (quadrantIdx) => {
      if (!addText.trim()) return
      updateFramework((fw) => ({
        ...fw,
        quadrants: fw.quadrants.map((q, i) =>
          i === quadrantIdx
            ? { ...q, items: [...q.items, createItem(addText.trim())] }
            : q
        ),
      }))
      setAddText('')
      addInputRef.current?.focus()
    },
    [addText, updateFramework]
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

  const startEdit = useCallback((quadrantIdx, item) => {
    setEditingItem({ quadrantIdx, itemId: item.id })
    setEditText(item.text)
  }, [])

  const saveEdit = useCallback(() => {
    if (!editingItem) return
    if (editText.trim()) {
      updateFramework((fw) => ({
        ...fw,
        quadrants: fw.quadrants.map((q, i) =>
          i === editingItem.quadrantIdx
            ? {
                ...q,
                items: q.items.map((it) =>
                  it.id === editingItem.itemId ? { ...it, text: editText.trim() } : it
                ),
              }
            : q
        ),
      }))
    }
    setEditingItem(null)
  }, [editingItem, editText, updateFramework])

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
        <button className="btn btn--secondary btn--sm" onClick={onReflect}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
          Reflect
        </button>
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
                    onClick={() => {
                      setAddingQuadrant(addingQuadrant === idx ? null : idx)
                      setAddText('')
                      setTimeout(() => addInputRef.current?.focus(), 0)
                    }}
                    title="Add item"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                  </button>
                </div>
              </div>

              {addingQuadrant === idx && (
                <form
                  className="quadrant__add-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleAddItem(idx)
                  }}
                >
                  <input
                    ref={addInputRef}
                    type="text"
                    value={addText}
                    onChange={(e) => setAddText(e.target.value)}
                    placeholder="Type and press Enter..."
                    className="quadrant__add-input"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setAddingQuadrant(null)
                        setAddText('')
                      }
                    }}
                    onBlur={() => {
                      if (!addText.trim()) {
                        setAddingQuadrant(null)
                      }
                    }}
                  />
                </form>
              )}

              <div className="quadrant__canvas" ref={(el) => (canvasRefs.current[idx] = el)}>
                {quadrant.items.map((item) => {
                  const isDragging = drag?.itemId === item.id
                  const isEditing =
                    editingItem?.quadrantIdx === idx && editingItem?.itemId === item.id

                  return (
                    <div
                      key={item.id}
                      className={`card ${isDragging ? 'card--dragging' : ''}`}
                      style={{ left: `${item.x ?? 10}%`, top: `${item.y ?? 10}%` }}
                      onPointerDown={(e) => {
                        if (isEditing) return
                        handlePointerDown(e, idx, item)
                      }}
                    >
                      {isEditing ? (
                        <form
                          className="card__edit"
                          onSubmit={(e) => {
                            e.preventDefault()
                            saveEdit()
                          }}
                        >
                          <input
                            type="text"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            onBlur={saveEdit}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') setEditingItem(null)
                            }}
                            autoFocus
                          />
                        </form>
                      ) : (
                        <>
                          <span
                            className="card__text"
                            onDoubleClick={() => startEdit(idx, item)}
                          >
                            {item.text}
                          </span>
                          <div className="card__actions">
                            <button
                              className="card__btn"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => startEdit(idx, item)}
                              title="Edit"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                            <button
                              className="card__btn card__btn--danger"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => handleDeleteItem(idx, item.id)}
                              title="Delete"
                            >
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
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

      {/* Floating ghost card while dragging */}
      {drag && draggedItem && (
        <div
          className="card card--ghost"
          style={{
            left: drag.x - drag.grabX,
            top: drag.y - drag.grabY,
            width: drag.width,
            position: 'fixed',
            pointerEvents: 'none',
            zIndex: 9999,
          }}
        >
          <span className="card__text">{draggedItem.text}</span>
        </div>
      )}
    </div>
  )
}
