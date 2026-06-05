import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000'

export const SocketProvider = ({ children }) => {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (user) {
      socketRef.current = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
      })

      socketRef.current.on('connect', () => {
        setConnected(true)
        console.log('Socket connected:', socketRef.current.id)
      })

      socketRef.current.on('disconnect', () => {
        setConnected(false)
      })

      return () => {
        socketRef.current?.disconnect()
        setConnected(false)
      }
    }
  }, [user])

  const joinBoard = (boardId) => {
    socketRef.current?.emit('join-board', boardId)
  }

  const leaveBoard = (boardId) => {
    socketRef.current?.emit('leave-board', boardId)
  }

  const onEvent = (event, handler) => {
    socketRef.current?.on(event, handler)
    return () => socketRef.current?.off(event, handler)
  }

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, joinBoard, leaveBoard, onEvent }}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const ctx = useContext(SocketContext)
  if (!ctx) throw new Error('useSocket must be used within SocketProvider')
  return ctx
}
