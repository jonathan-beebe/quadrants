import './Card.css'

export default function Card({
  item,
  isDragging,
  isEditing,
  editText,
  onEditTextChange,
  onSaveEdit,
  onCancelEdit,
  onStartEdit,
  onDelete,
  onPointerDown,
}) {
  return (
    <div
      className={`card ${isDragging ? 'card--dragging' : ''}`}
      style={{ left: `${item.x ?? 10}%`, top: `${item.y ?? 10}%` }}
      onPointerDown={onPointerDown}
    >
      {isEditing ? (
        <form
          className="card__edit"
          onSubmit={(e) => {
            e.preventDefault()
            onSaveEdit()
          }}
        >
          <input
            type="text"
            value={editText}
            onChange={(e) => onEditTextChange(e.target.value)}
            onBlur={onSaveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onCancelEdit()
            }}
            autoFocus
          />
        </form>
      ) : (
        <>
          <span className="card__text" onDoubleClick={onStartEdit}>
            {item.text}
          </span>
          <div className="card__actions">
            <button
              className="card__btn"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={onStartEdit}
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
              onClick={onDelete}
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
}

export function GhostCard({ drag, text }) {
  return (
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
      <span className="card__text">{text}</span>
    </div>
  )
}
