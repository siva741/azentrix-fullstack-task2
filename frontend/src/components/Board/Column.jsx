import { useState } from 'react'
import { Droppable } from '@hello-pangea/dnd'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import TaskCard from '../Card/TaskCard'
import api from '../../services/api'

export default function Column({ column, board, allMembers, onBoardUpdate }) {
  const [showAddCard, setShowAddCard] = useState(false)
  const [cardTitle, setCardTitle] = useState('')
  const [adding, setAdding] = useState(false)

  const COLUMN_STYLES = {
    'To Do': { accent: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
    'In Progress': { accent: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    'Done': { accent: '#10b981', bg: 'rgba(16,185,129,0.08)' },
  }
  const style = COLUMN_STYLES[column.name] || { accent: '#6366f1', bg: 'rgba(99,102,241,0.08)' }

  const addCard = async (e) => {
    e.preventDefault()
    if (!cardTitle.trim()) return
    setAdding(true)
    try {
      const res = await api.post(`/boards/${board.id}/cards`, {
        title: cardTitle,
        columnId: column.id,
      })
      onBoardUpdate(prev => {
        if (!prev) return prev
        return {
          ...prev,
          columns: prev.columns.map(col => {
            if (col.id !== column.id) return col
            // Prevent duplicate card if socket event has already processed it
            const exists = col.cards.some(c => c.id === res.data.id)
            if (exists) return col
            return { ...col, cards: [...col.cards, res.data] }
          })
        }
      })
      setCardTitle('')
      setShowAddCard(false)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add card')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="column" style={{ '--col-accent': style.accent, '--col-bg': style.bg }}>
      <div className="column-header">
        <div className="column-title-row">
          <div className="column-indicator" style={{ background: style.accent }}></div>
          <h3 className="column-title">{column.name}</h3>
          <span className="column-count">{column.cards.length}</span>
        </div>
        <button className="icon-btn" onClick={() => setShowAddCard(true)} title="Add card">
          <Plus size={16} />
        </button>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`column-body ${snapshot.isDraggingOver ? 'drag-over' : ''}`}
            style={{ background: snapshot.isDraggingOver ? style.bg : undefined }}
          >
            <AnimatePresence>
              {column.cards.map((card, index) => (
                <TaskCard
                  key={card.id}
                  card={card}
                  index={index}
                  board={board}
                  allMembers={allMembers}
                  onBoardUpdate={onBoardUpdate}
                />
              ))}
            </AnimatePresence>
            {provided.placeholder}

            <AnimatePresence>
              {showAddCard && (
                <motion.form
                  className="add-card-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={addCard}
                >
                  <textarea
                    className="add-card-input"
                    placeholder="Card title..."
                    value={cardTitle}
                    onChange={e => setCardTitle(e.target.value)}
                    autoFocus
                    rows={2}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addCard(e) }
                      if (e.key === 'Escape') setShowAddCard(false)
                    }}
                  />
                  <div className="add-card-actions">
                    <button type="submit" className="btn-primary btn-xs" disabled={adding || !cardTitle.trim()}>
                      {adding ? 'Adding...' : 'Add Card'}
                    </button>
                    <button type="button" className="icon-btn" onClick={() => { setShowAddCard(false); setCardTitle('') }}>
                      <X size={16} />
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        )}
      </Droppable>

      {!showAddCard && (
        <button className="add-card-btn" onClick={() => setShowAddCard(true)}>
          <Plus size={14} /> Add a card
        </button>
      )}
    </div>
  )
}
