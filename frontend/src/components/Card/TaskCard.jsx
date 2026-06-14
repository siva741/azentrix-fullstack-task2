import { useState } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import { Calendar, AlertCircle, Pencil } from 'lucide-react'
import { format, isPast, isToday } from 'date-fns'
import { useAuth } from '../../context/useAuth'
import CardModal from './CardModal'

const PRIORITY_CONFIG = {
  LOW: { label: 'Low', color: '#22a06b', bg: 'rgba(34,160,107,0.12)' },
  MEDIUM: { label: 'Medium', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  HIGH: { label: 'High', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

export default function TaskCard({ card, index, board, allMembers, onBoardUpdate }) {
  const [showModal, setShowModal] = useState(false)
  const { user } = useAuth()
  const priority = PRIORITY_CONFIG[card.priority] || PRIORITY_CONFIG.MEDIUM

  const canEdit = user.role === 'ADMIN' || card.createdById === user.id

  const dueDateStatus = card.dueDate ? (
    isPast(new Date(card.dueDate)) && !isToday(new Date(card.dueDate)) ? 'overdue'
    : isToday(new Date(card.dueDate)) ? 'today'
    : 'upcoming'
  ) : null

  return (
    <>
      <Draggable draggableId={card.id} index={index} isDragDisabled={!canEdit}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`task-card ${snapshot.isDragging ? 'is-dragging' : ''}`}
            onClick={() => setShowModal(true)}
            style={{ ...provided.draggableProps.style }}
          >
            {/* Priority indicator bar */}
            <div className="card-priority-bar" style={{ background: priority.color }}></div>

            <div className="card-content">
              <div className="card-header-row">
                <span
                  className="priority-badge"
                  style={{ color: priority.color, background: priority.bg }}
                >
                  {priority.label}
                </span>
                {canEdit && (
                  <button className="card-edit-btn" onClick={e => { e.stopPropagation(); setShowModal(true) }}>
                    <Pencil size={11} />
                  </button>
                )}
              </div>

              <h4 className="card-title">{card.title}</h4>

              {card.description && (
                <p className="card-desc">{card.description}</p>
              )}

              <div className="card-footer">
                {card.dueDate && (
                  <span className={`due-date-badge due-${dueDateStatus}`}>
                    <Calendar size={11} />
                    {format(new Date(card.dueDate), 'MMM d')}
                    {dueDateStatus === 'overdue' && <AlertCircle size={11} />}
                  </span>
                )}
                {card.assignee && (
                  <div
                    className="card-assignee"
                    title={card.assignee.name}
                    style={{ background: `hsl(${card.assignee.name.charCodeAt(0) * 15}, 65%, 45%)` }}
                  >
                    {card.assignee.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Draggable>

      {showModal && (
        <CardModal
          card={card}
          board={board}
          allMembers={allMembers}
          onClose={() => setShowModal(false)}
          onBoardUpdate={onBoardUpdate}
        />
      )}
    </>
  )
}
