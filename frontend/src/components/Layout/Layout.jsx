import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Layers, LayoutDashboard, Shield, LogOut, Wifi } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useSocket } from '../../context/SocketContext'
import toast from 'react-hot-toast'

export default function Layout() {
  const { user, logout } = useAuth()
  const { connected } = useSocket()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(user?.role === 'ADMIN' ? [{ to: '/admin', label: 'Admin', icon: Shield }] : []),
  ]

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Layers size={24} className="brand-icon" />
          <span className="brand-name">TaskFlow</span>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={`nav-link ${location.pathname === to ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{label}</span>
              {location.pathname === to && (
                <motion.div className="nav-indicator" layoutId="nav-indicator" />
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div
              className="avatar"
              style={{ background: `hsl(${user?.name?.charCodeAt(0) * 15}, 65%, 45%)` }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name-small">{user?.name}</span>
              <span className={`role-badge ${user?.role?.toLowerCase()}`}>
                {user?.role}
              </span>
            </div>
          </div>
          <div className="sidebar-bottom-actions">
            <div className={`connection-dot ${connected ? 'online' : 'offline'}`} title={connected ? 'Connected' : 'Disconnected'}>
              <Wifi size={12} />
            </div>
            <button className="icon-btn" onClick={handleLogout} title="Logout">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  )
}
