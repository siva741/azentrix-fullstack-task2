import { useState, useEffect } from 'react'
import api from '../services/api'
import { AuthContext } from './authContext'

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')))

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) return undefined

    let active = true
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`

    api.get('/auth/me')
      .then(res => {
        if (active) setUser(res.data.user)
      })
      .catch(() => {
        localStorage.removeItem('token')
        delete api.defaults.headers.common['Authorization']
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password })
    const { user, token } = res.data
    localStorage.setItem('token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    return user
  }

  const register = async (name, email, password) => {
    const res = await api.post('/auth/register', { name, email, password })
    const { user, token } = res.data
    localStorage.setItem('token', token)
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    setUser(user)
    return user
  }

  const logout = () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
