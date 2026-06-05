import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Layout, Users, Trash2, X, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const BOARD_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6']

export default function DashboardPage() {
  const [boards, setBoards] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [boardName, setBoardName] = useState('')
  const [boardDesc, setBoardDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    try {
      const res = await api.get('/boards')
      setBoards(res.data)
    } catch {
      toast.error('Failed to load boards')
    } finally {
      setLoading(false)
    }
  }

  const createBoard = async (e) => {
    e.preventDefault()
    if (!boardName.trim()) return
    setCreating(true)
    try {
      const res = await api.post('/boards', { name: boardName, description: boardDesc })
      setBoards(prev => [res.data, ...prev])
      setBoardName('')
      setBoardDesc('')
      setShowModal(false)
      toast.success('Board created!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create board')
    } finally {
      setCreating(false)
    }
  }

  const deleteBoard = async (e, boardId) => {
    e.stopPropagation()
    if (!confirm('Delete this board? This cannot be undone.')) return
    try {
      await api.delete(`/boards/${boardId}`)
      setBoards(prev => prev.filter(b => b.id !== boardId))
      toast.success('Board deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete board')
    }
  }

  const getBoardColor = (id) => BOARD_COLORS[id.charCodeAt(0) % BOARD_COLORS.length]

  if (loading) return (
    <div className="page-loading">
      <div className="spinner"></div>
    </div>
  )

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Boards</h1>
          <p className="page-subtitle">Manage your team's work, all in one place</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Board
        </button>
      </div>

      {boards.length === 0 ? (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Layout size={64} className="empty-icon" />
          <h3>No boards yet</h3>
          <p>Create your first board to start collaborating</p>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={16} /> Create Board
          </button>
        </motion.div>
      ) : (
        <motion.div
          className="boards-grid"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {boards.map(board => (
            <motion.div
              key={board.id}
              className="board-card"
              variants={cardVariants}
              onClick={() => navigate(`/board/${board.id}`)}
              whileHover={{ y: -4, scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              <div
                className="board-card-header"
                style={{ background: `linear-gradient(135deg, ${getBoardColor(board.id)}22, ${getBoardColor(board.id)}44)`, borderBottom: `2px solid ${getBoardColor(board.id)}66` }}
              >
                <div className="board-color-dot" style={{ background: getBoardColor(board.id) }}></div>
                <div className="board-card-actions">
                  {(user.role === 'ADMIN' || board.ownerId === user.id) && (
                    <button
                      className="icon-btn danger"
                      onClick={(e) => deleteBoard(e, board.id)}
                      title="Delete board"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="board-card-body">
                <h3 className="board-card-title">{board.name}</h3>
                {board.description && <p className="board-card-desc">{board.description}</p>}
                <div className="board-card-meta">
                  <span className="meta-item">
                    <Users size={12} />
                    {(board.members?.length || 0) + 1} member{board.members?.length !== 0 ? 's' : ''}
                  </span>
                  <span className="board-owner-badge">
                    {board.ownerId === user.id ? 'Owner' : 'Member'}
                  </span>
                </div>
              </div>
              <div className="board-card-footer">
                <span className="view-board-link">
                  Open Board <ChevronRight size={14} />
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div
              className="modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Create New Board</h2>
                <button className="icon-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
              </div>
              <form onSubmit={createBoard} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Board Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Sprint 1, Marketing Campaign..."
                    value={boardName}
                    onChange={e => setBoardName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description (optional)</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="What's this board for?"
                    value={boardDesc}
                    onChange={e => setBoardDesc(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={creating}>
                    {creating ? <><span className="spinner-sm"></span> Creating...</> : <><Plus size={16} /> Create Board</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
