import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Trash2, Crown, UserCheck, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const { user: currentUser } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const res = await api.get('/admin/users')
      setUsers(res.data)
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
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
                transition={{ delay: i * 0.05 }}
              >
                <td>
                  <div className="user-cell">
                    <div
                      className="avatar avatar-sm"
                      style={{ background: `hsl(${u.name.charCodeAt(0) * 15}, 65%, 45%)` }}
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
    </div>
  )
}
