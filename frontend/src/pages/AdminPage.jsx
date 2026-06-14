import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Trash2, Crown, UserCheck, Users, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../context/useAuth'

const blankUserForm = {
  name: '',
  email: '',
  password: '',
  role: 'MEMBER',
}

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [form, setForm] = useState(blankUserForm)
  const [creating, setCreating] = useState(false)
  const { user: currentUser } = useAuth()

  useEffect(() => {
    let active = true

    const loadUsers = async () => {
      try {
        const res = await api.get('/admin/users')
        if (active) setUsers(res.data)
      } catch {
        if (active) toast.error('Failed to load users')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadUsers()

    return () => {
      active = false
    }
  }, [])

  const createUser = async (e) => {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await api.post('/admin/users', form)
      setUsers(prev => [...prev, res.data])
      setForm(blankUserForm)
      setShowCreateModal(false)
      toast.success('User created')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user')
    } finally {
      setCreating(false)
    }
  }

  const toggleRole = async (userId, currentRole) => {
    const newRole = currentRole === 'ADMIN' ? 'MEMBER' : 'ADMIN'
    try {
      const res = await api.patch(`/admin/users/${userId}`, { role: newRole })
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: res.data.role } : u))
      toast.success(`User is now ${newRole}`)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role')
    }
  }

  const deleteUser = async (userId) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    try {
      await api.delete(`/admin/users/${userId}`)
      setUsers(prev => prev.filter(u => u.id !== userId))
      toast.success('User deleted')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user')
    }
  }

  if (loading) return <div className="page-loading"><div className="spinner"></div></div>

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h1 className="page-title"><Shield size={24} /> Admin Panel</h1>
          <p className="page-subtitle">Manage workspace users and permissions</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          <Plus size={16} /> New User
        </button>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <Users size={24} />
          <div>
            <div className="stat-number">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <Crown size={24} />
          <div>
            <div className="stat-number">{users.filter(u => u.role === 'ADMIN').length}</div>
            <div className="stat-label">Admins</div>
          </div>
        </div>
        <div className="stat-card">
          <UserCheck size={24} />
          <div>
            <div className="stat-number">{users.filter(u => u.role === 'MEMBER').length}</div>
            <div className="stat-label">Members</div>
          </div>
        </div>
      </div>

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Boards</th>
              <th>Cards</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <motion.tr
                key={u.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <td>
                  <div className="user-cell">
                    <div
                      className="avatar avatar-sm"
                      style={{ background: `hsl(${u.name.charCodeAt(0) * 15}, 62%, 40%)` }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="user-name">
                      {u.name}
                      {u.id === currentUser.id && <span className="you-badge">You</span>}
                    </span>
                  </div>
                </td>
                <td><span className="text-muted">{u.email}</span></td>
                <td>
                  <span className={`role-badge ${u.role.toLowerCase()}`}>
                    {u.role === 'ADMIN' ? <Crown size={12} /> : <UserCheck size={12} />}
                    {u.role}
                  </span>
                </td>
                <td><span className="text-muted">{u._count?.ownedBoards || 0}</span></td>
                <td><span className="text-muted">{u._count?.createdCards || 0}</span></td>
                <td><span className="text-muted">{new Date(u.createdAt).toLocaleDateString()}</span></td>
                <td>
                  <div className="action-buttons">
                    {u.id !== currentUser.id && (
                      <>
                        <button
                          className="btn-xs btn-secondary"
                          onClick={() => toggleRole(u.id, u.role)}
                          title={`Switch to ${u.role === 'ADMIN' ? 'Member' : 'Admin'}`}
                        >
                          {u.role === 'ADMIN' ? 'Make Member' : 'Make Admin'}
                        </button>
                        <button
                          className="btn-xs btn-danger"
                          onClick={() => deleteUser(u.id)}
                          title="Delete user"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showCreateModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowCreateModal(false)}>
            <motion.div
              className="modal modal-sm"
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>Create User</h2>
                <button className="icon-btn" onClick={() => setShowCreateModal(false)}><X size={18} /></button>
              </div>
              <form onSubmit={createUser} className="modal-form">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input type="password" className="form-input" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={6} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Role</label>
                  <select className="form-input form-select" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={creating}>
                    {creating ? <><span className="spinner-sm"></span> Creating...</> : <><Plus size={16} /> Create</>}
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
