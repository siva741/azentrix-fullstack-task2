import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Trash2, Save, User, Calendar, Flag, AlignLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import api from '../../services/api'
import { useAuth } from '../../context/useAuth'

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH']
const PRIORITY_COLORS = {
  LOW: '#22a06b', MEDIUM: '#f59e0b', HIGH: '#ef4444'
}

export default function CardModal({ card, board, allMembers, onClose, onBoardUpdate }) {
  const { user } = useAuth()
  const [form, setForm] = useState({
    title: card.title,
    description: card.description || '',
    priority: PRIORITIES.includes(card.priority) ? card.priority : 'MEDIUM',
    dueDate: card.dueDate ? format(new Date(card.dueDate), 'yyyy-MM-dd') : '',
    assigneeId: card.assigneeId || '',
    columnId: card.columnId,
  })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const canEdit = user.role === 'ADMIN' || card.createdById === user.id

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    setSaving(true)
    try {
      const res = await api.patch(`/cards/${card.id}`, {
        ...form,
        dueDate: form.dueDate || null,
        assigneeId: form.assigneeId || null,
      })
      onBoardUpdate(prev => ({
        ...prev,
        columns: prev.columns.map(col => ({
          ...col,
          cards: col.cards
            .filter(c => c.id !== card.id)
            .concat(col.id === res.data.columnId ? [res.data] : [])
            .sort((a, b) => a.order - b.order)
        }))
      }))
      toast.success('Card updated!')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update card')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this card? This cannot be undone.')) return
    setDeleting(true)
    try {
      await api.delete(`/cards/${card.id}`)
      onBoardUpdate(prev => ({
        ...prev,
        columns: prev.columns.map(col => ({
          ...col,
          cards: col.cards.filter(c => c.id !== card.id)
        }))
      }))
      toast.success('Card deleted')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete card')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className="modal modal-lg card-modal"
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 20 }}
        transition={{ duration: 0.25 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Priority bar */}
        <div className="card-modal-bar" style={{ background: PRIORITY_COLORS[form.priority] }}></div>

        <div className="modal-header">
          <h2>
            {canEdit ? (
              <input
                className="card-title-input"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Card title..."
              />
            ) : (
              <span>{card.title}</span>
            )}
          </h2>
          <div className="modal-header-actions">
            {canEdit && (
              <button className="icon-btn danger" onClick={handleDelete} disabled={deleting} title="Delete card">
                <Trash2 size={16} />
              </button>
            )}
            <button className="icon-btn" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className="card-modal-body">
          <div className="card-modal-left">
            {/* Description */}
            <div className="modal-section">
              <label className="modal-label"><AlignLeft size={14} /> Description</label>
              {canEdit ? (
                <textarea
                  className="form-input form-textarea"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Add a description..."
                  rows={5}
                />
              ) : (
                <p className="text-muted">{card.description || 'No description'}</p>
              )}
            </div>

            {/* Move to column */}
            {canEdit && (
              <div className="modal-section">
                <label className="modal-label">Move to Column</label>
                <select
                  className="form-input form-select"
                  value={form.columnId}
                  onChange={e => setForm(f => ({ ...f, columnId: e.target.value }))}
                >
                  {board.columns.map(col => (
                    <option key={col.id} value={col.id}>{col.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="card-modal-right">
            {/* Priority */}
            <div className="modal-section">
              <label className="modal-label"><Flag size={14} /> Priority</label>
              {canEdit ? (
                <div className="priority-selector">
                  {PRIORITIES.map(p => (
                    <button
                      key={p}
                      className={`priority-option ${form.priority === p ? 'active' : ''}`}
                      style={{ '--p-color': PRIORITY_COLORS[p] }}
                      onClick={() => setForm(f => ({ ...f, priority: p }))}
                    >
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="priority-badge" style={{ color: PRIORITY_COLORS[card.priority] }}>
                  {card.priority}
                </span>
              )}
            </div>

            {/* Assignee */}
            <div className="modal-section">
              <label className="modal-label"><User size={14} /> Assignee</label>
              {canEdit ? (
                <select
                  className="form-input form-select"
                  value={form.assigneeId}
                  onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {allMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name}</option>
                  ))}
                </select>
              ) : (
                <div className="assignee-display">
                  {card.assignee ? (
                    <div className="user-cell">
                      <div className="avatar avatar-sm" style={{ background: `hsl(${card.assignee.name.charCodeAt(0) * 15}, 65%, 45%)` }}>
                        {card.assignee.name.charAt(0)}
                      </div>
                      {card.assignee.name}
                    </div>
                  ) : <span className="text-muted">Unassigned</span>}
                </div>
              )}
            </div>

            {/* Due Date */}
            <div className="modal-section">
              <label className="modal-label"><Calendar size={14} /> Due Date</label>
              {canEdit ? (
                <input
                  type="date"
                  className="form-input"
                  value={form.dueDate}
                  onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                />
              ) : (
                <span className="text-muted">
                  {card.dueDate ? format(new Date(card.dueDate), 'MMM d, yyyy') : 'No due date'}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="modal-section">
              <label className="modal-label">Created by</label>
              <div className="user-cell">
                <div className="avatar avatar-sm" style={{ background: `hsl(${card.createdBy.name.charCodeAt(0) * 15}, 65%, 45%)` }}>
                  {card.createdBy.name.charAt(0)}
                </div>
                <span className="text-muted">{card.createdBy.name}</span>
              </div>
            </div>
          </div>
        </div>

        {canEdit && (
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner-sm"></span> Saving...</> : <><Save size={14} /> Save Changes</>}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
