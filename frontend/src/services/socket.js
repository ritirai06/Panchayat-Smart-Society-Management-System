import { io } from 'socket.io-client'

let socket = null

export const connectSocket = (societyId) => {
  const backendUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'
  socket = io(backendUrl, { transports: ['websocket'] })
  socket.on('connect', () => {
    console.log('Socket connected')
    if (societyId) socket.emit('join_society', societyId)
  })
  return socket
}

export const getSocket = () => socket

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null }
}
