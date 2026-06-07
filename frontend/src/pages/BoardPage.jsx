import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, UserPlus, X, Wifi, WifiOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import api from '../services/api'
import KanbanBoard from '../components/Board/KanbanBoard'

export default function BoardPage() {
  const { boardId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { joinBoard, leaveBoard, onEvent, connected } = useSocket()

  const [board, setBoard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [memberEmail, setMemberEmail] = useState('')
  const [addingMember, setAddingMember] = useState(false)

  const fetchBoard = useCallback(async () => {
    try {
      const res = await api.get(`/boards/${boardId}`)
      setBoard(res.data)
    } catch (err) {
      toast.error('Failed to load board')
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }, [boardId, navigate])

  useEffect(() => {
    fetchBoard()
  }, [fetchBoard])

  useEffect(() => {
    if (board) {
      joinBoard(boardId)
      return () => leaveBoard(boardId)
    }
  }, [board, boardId, joinBoard, leaveBoard])

  // Real-time socket listeners
  useEffect(() => {
    const cleanups = [
      onEvent('card:created', (card) => {
        setBoard(prev => {
          if (!prev) return prev
          // Prevent duplicates for the client who created the card
          const alreadyExists = prev.columns.some(col =>
            col.cards.some(c => c.id === card.id)
          )
          if (alreadyExists) return prev
          return {
            ...prev,
            columns: prev.columns.map(col =>
              col.id === card.columnId
                ? { ...col, cards: [...col.cards, card] }
                : col
            )
          }
        })
        toast('📌 New card added', { icon: '🆕' })
      }),

      onEvent('card:updated', (updatedCard) => {
        setBoard(prev => {
          if (!prev) return prev
          return {
            ...prev,
            columns: prev.columns.map(col => {
              const isTargetCol = col.id === updatedCard.columnId
              const hasCard = col.cards.some(c => c.id === updatedCard.id)

              if (isTargetCol) {
                if (hasCard) {
                  // Update card in place
                  return {
                    ...col,
                    cards: col.cards.map(c => c.id === updatedCard.id ? updatedCard : c)
                  }
                } else {
                  // Add card to target column (it moved from another column)
                  return {
                    ...col,
                    cards: [...col.cards, updatedCard]
                  }
                }
              } else {
                if (hasCard) {
                  // Remove card from old column (it moved to another column)
                  return {
                    ...col,
                    cards: col.cards.filter(c => c.id !== updatedCard.id)
                  }
                } else {
                  // Unchanged
                  return col
                }
              }
            })
          }
        })
      }),

      onEvent('card:deleted', ({ id }) => {
        setBoard(prev => {
          if (!prev) return prev
          return {
            ...prev,
            columns: prev.columns.map(col => ({
              ...col,
              cards: col.cards.filter(c => c.id !== id)
            }))
          }
        })
        toast('🗑️ Card removed', { icon: '🗑️' })
      }),

      onEvent('card:reordered', ({ cards: updatedCards }) => {
        setBoard(prev => {
          if (!prev) return prev
          
          // Gather all current cards across all columns into a single flat array
          const allCards = prev.columns.flatMap(col => col.cards)
          
          // Map of updated cards to overlay new order/column properties
          const cardMap = {}
          updatedCards.forEach(c => { cardMap[c.id] = c })
          
          const updatedAllCards = allCards.map(c => 
            cardMap[c.id] ? { ...c, ...cardMap[c.id] } : c
          )
          
          // Distribute cards to their correct columns and sort by order
          return {
            ...prev,
            columns: prev.columns.map(col => ({
              ...col,
              cards: updatedAllCards
                .filter(c => c.columnId === col.id)
                .sort((a, b) => a.order - b.order)
            }))
          }
        })
      }),
    ]
    return () => cleanups.forEach(cleanup => cleanup && cleanup())
  }, [onEvent])

  const addMember = async (e) => {
    e.preventDefault()
    setAddingMember(true)
    try {
      const res = await api.post(`/boards/${boardId}/members`, { email: memberEmail })
      setBoard(prev => ({ ...prev, members: res.data.members }))
      setMemberEmail('')
      setShowMemberModal(false)
      toast.success('Member added!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member')
    } finally {
      setAddingMember(false)
    }
  }

  const handleBoardUpdate = useCallback((updater) => {
    setBoard(updater)
  }, [])

  if (loading) return (
    <div className="page-loading"><div className="spinner"></div></div>
  )

  if (!board) return null

  const allMembers = [
    board.owner,
    ...(board.members?.map(m => m.user) || [])
  ]

  const isOwnerOrAdmin = board.ownerId === user.id || user.role === 'ADMIN'

  return (
    <div className="board-page">
      <div className="board-header">
        <div className="board-header-left">
          <button className="icon-btn" onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="board-title">{board.name}</h1>
            {board.description && <p className="board-description">{board.description}</p>}
          </div>
        </div>

        <div className="board-header-right">
          <div className={`connection-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span>{connected ? 'Live' : 'Offline'}</span>
          </div>

          <div className="member-avatars">
            {allMembers.slice(0, 5).map(member => (
              <div
                key={member.id}
                className="avatar"
                title={member.name}
                style={{ background: `hsl(${member.name.charCodeAt(0) * 15}, 65%, 45%)` }}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {allMembers.length > 5 && (
              <div className="avatar avatar-more">+{allMembers.length - 5}</div>
            )}
          </div>

          {isOwnerOrAdmin && (
            <button className="btn-secondary btn-sm" onClick={() => setShowMemberModal(true)}>
              <UserPlus size={14} /> Add Member
            </button>
          )}
        </div>
      </div>

      <KanbanBoard
        board={board}
        onBoardUpdate={handleBoardUpdate}
        allMembers={allMembers}
      />

      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <motion.div
            className="modal modal-sm"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Add Member</h2>
              <button className="icon-btn" onClick={() => setShowMemberModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={addMember} className="modal-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="teammate@example.com"
                  value={memberEmail}
                  onChange={e => setMemberEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={addingMember}>
                  {addingMember ? <><span className="spinner-sm"></span> Adding...</> : <><UserPlus size={14} /> Add</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}
