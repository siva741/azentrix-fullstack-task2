import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './useAuth'
import { SocketContext } from './socketContext'

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

  const joinBoard = useCallback((boardId) => {
    socketRef.current?.emit('join-board', boardId)
  }, [])

  const leaveBoard = useCallback((boardId) => {
    socketRef.current?.emit('leave-board', boardId)
  }, [])

  const onEvent = useCallback((event, handler) => {
    socketRef.current?.on(event, handler)
    return () => socketRef.current?.off(event, handler)
  }, [])

  const value = useMemo(() => ({
    connected,
    joinBoard,
    leaveBoard,
    onEvent,
  }), [connected, joinBoard, leaveBoard, onEvent])

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}
