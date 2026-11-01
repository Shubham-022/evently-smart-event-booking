// src/services/socket.js
import { io } from 'socket.io-client';

// Backend socket URL - defaults to VITE_BACKEND_URL, or derives from VITE_API_URL, or localhost:5002
const apiUrl = import.meta.env.VITE_API_URL || '';
const derivedBackendUrl = apiUrl ? apiUrl.replace(/\/api\/?$/, '') : 'http://localhost:5002';
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || derivedBackendUrl;

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});
