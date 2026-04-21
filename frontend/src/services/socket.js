import { io } from 'socket.io-client'

let socket = null

export const connectSocket = (societyId) => {
  socket = io('http://localhost:5000', { transports: ['websocket'] })
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
