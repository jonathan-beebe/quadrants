import { useState, useRef, useCallback } from 'react'
import { createItem } from '../storage'
import './QuadrantCanvas.css'

export default function QuadrantCanvas({ framework, onUpdate, onReflect, onEdit }) {
  const [dragItem, setDragItem] = useState(null)
  const [dragOverQuadrant, setDragOverQuadrant] = useState(null)

  const updateQuadrant = useCallback(
    (quadrantIdx, updater) => {
      const updated = { ...framework }
      updated.quadrants = updated.quadrants.map((q, i) =>
        i === quadrantIdx ? { ...q, ...updater(q) } : q
      )
      onUpdate(updated)
    },
    [framework, onUpdate]
  )

  const addItem = useCallback(
    (quadrantIdx, text) => {
      updateQuadrant(quadrantIdx, (q) => ({
        items: [...q.items, createItem(text)],
      }))
    },
    [updateQuadrant]
  )

  const editItem = useCallback(
    (quadrantIdx, itemId, text) => {
      updateQuadrant(quadrantIdx, (q) => ({
        items: q.items.map((item) => (item.id === itemId ? { ...item, text } : item)),
      }))
    },
    [updateQuadrant]
  )

  const deleteItem = useCallback(
    (quadrantIdx, itemId) => {
      updateQuadrant(quadrantIdx, (q) => ({
        items: q.items.filter((item) => item.id !== itemId),
      }))
    },
    [updateQuadrant]
  )

  const handleDragStart = useCallback((quadrantIdx, item) => {
    setDragItem({ quadrantIdx, item })
  }, [])

  const handleDragOver = useCallback((e, quadrantIdx) => {
    e.preventDefault()
    setDragOverQuadrant(quadrantIdx)
  }, [])

  const handleDrop = useCallback(
    (targetIdx) => {
      if (!dragItem) return
      if (dragItem.quadrantIdx === targetIdx) {
        setDragItem(null)
        setDragOverQuadrant(null)
        return
      }

      const updated = { ...framework }
      updated.quadrants = updated.quadrants.map((q, i) => {
        if (i === dragItem.quadrantIdx) {
          return { ...q, items: q.items.filter((item) => item.id !== dragItem.item.id) }
        }
        if (i === targetIdx) {
          return { ...q, items: [...q.items, dragItem.item] }
        }
        return q
      })
      onUpdate(updated)
      setDragItem(null)
      setDragOverQuadrant(null)
    },
    [dragItem, framework, onUpdate]
  )

  const handleDragEnd = useCallback(() => {
    setDragItem(null)
    setDragOverQuadrant(null)
  }, [])

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
        <div className="canvas__grid">
          {framework.quadrants.map((quadrant, idx) => (
            <Quadrant
              key={idx}
              index={idx}
              quadrant={quadrant}
              isDragOver={dragOverQuadrant === idx}
              onAdd={(text) => addItem(idx, text)}
              onEdit={(itemId, text) => editItem(idx, itemId, text)}
              onDelete={(itemId) => deleteItem(idx, itemId)}
              onDragStart={(item) => handleDragStart(idx, item)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
        {framework.axisX && (
          <div className="canvas__axis-x">
            <span>{framework.axisX}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Quadrant({
  index,
  quadrant,
  isDragOver,
  onAdd,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  const [newText, setNewText] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const inputRef = useRef(null)

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newText.trim()) return
    onAdd(newText.trim())
    setNewText('')
    inputRef.current?.focus()
  }

  const startEdit = (item) => {
    setEditingId(item.id)
    setEditText(item.text)
  }

  const saveEdit = (itemId) => {
    if (editText.trim()) {
      onEdit(itemId, editText.trim())
    }
    setEditingId(null)
  }

  return (
    <div
      className={`quadrant quadrant--${index} ${isDragOver ? 'quadrant--drag-over' : ''}`}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={() => {}}
    >
      <div className="quadrant__header">
        <h3 className="quadrant__title">{quadrant.label}</h3>
        <span className="quadrant__count">{quadrant.items.length}</span>
      </div>

      <div className="quadrant__items">
        {quadrant.items.map((item) => (
          <div
            key={item.id}
            className="quadrant__item"
            draggable
            onDragStart={() => onDragStart(item)}
            onDragEnd={onDragEnd}
          >
            {editingId === item.id ? (
              <form
                className="quadrant__item-edit"
                onSubmit={(e) => {
                  e.preventDefault()
                  saveEdit(item.id)
                }}
              >
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={() => saveEdit(item.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setEditingId(null)
                  }}
                  autoFocus
                />
              </form>
            ) : (
              <>
                <span
                  className="quadrant__item-text"
                  onDoubleClick={() => startEdit(item)}
                >
                  {item.text}
                </span>
                <div className="quadrant__item-actions">
                  <button
                    className="quadrant__item-btn"
                    onClick={() => startEdit(item)}
                    title="Edit"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    className="quadrant__item-btn quadrant__item-btn--danger"
                    onClick={() => onDelete(item.id)}
                    title="Delete"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      <form className="quadrant__add" onSubmit={handleAdd}>
        <input
          ref={inputRef}
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Add item..."
          className="quadrant__add-input"
        />
      </form>
    </div>
  )
}
