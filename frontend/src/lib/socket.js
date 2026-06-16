import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

export function connectSocket(userId) {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    auth: { userId },
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) { socket.disconnect(); socket = null; }
}

export function getSocket() {
  return socket;
}
