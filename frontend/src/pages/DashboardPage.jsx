import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Layout, Users, Trash2, X, ChevronRight, ListChecks, CheckCircle2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/useAuth'
import api from '../services/api'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
}

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 }
}

const BOARD_COLORS = ['#0c66e4', '#22a06b', '#f59e0b', '#ef4444', '#6e5dc6', '#0ca6a6']

export default function DashboardPage() {
  const [boards, setBoards] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [boardName, setBoardName] = useState('')
  const [boardDesc, setBoardDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    const loadDashboard = async () => {
      try {
        const [boardsRes, tasksRes] = await Promise.all([
          api.get('/boards'),
          api.get('/tasks'),
        ])
        if (!active) return
        setBoards(boardsRes.data)
        setTasks(tasksRes.data)
      } catch {
        if (active) toast.error('Failed to load dashboard')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboard()

    return () => {
      active = false
    }
  }, [])

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
      setTasks(prev => prev.filter(t => t.boardId !== boardId))
      toast.success('Board deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete board')
    }
  }

  const getBoardColor = (id) => BOARD_COLORS[id.charCodeAt(0) % BOARD_COLORS.length]
  const completedTasks = tasks.filter(task => task.status === 'DONE').length
  const pendingTasks = tasks.length - completedTasks

  if (loading) return (
    <div className="page-loading">
      <div className="spinner"></div>
    </div>
  )

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">A focused scrum board workspace for your team</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> New Board
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <Layout size={22} />
          <div>
            <div className="stat-number">{boards.length}</div>
            <div className="stat-label">Total Boards</div>
          </div>
        </div>
        <div className="stat-card">
          <ListChecks size={22} />
          <div>
            <div className="stat-number">{tasks.length}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <CheckCircle2 size={22} />
          <div>
            <div className="stat-number">{completedTasks}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <Clock size={22} />
          <div>
            <div className="stat-number">{pendingTasks}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
      </div>

      <div className="section-title-row">
        <h2>Boards</h2>
      </div>

      {boards.length === 0 ? (
        <motion.div
          className="empty-state"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Layout size={56} className="empty-icon" />
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
              whileHover={{ y: -2 }}
              transition={{ duration: 0.2 }}
            >
              <div className="board-card-header">
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
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
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
                    placeholder="e.g. Sprint 1"
                    value={boardName}
                    onChange={e => setBoardName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input form-textarea"
                    placeholder="What is this board for?"
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
