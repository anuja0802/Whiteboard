// socket.js
// WHY a singleton?
// If you create a new socket in every component, you get multiple
// connections to the server — one per component. That's wasteful and
// causes duplicate events. Instead, create ONE socket and import it
// everywhere. This is the standard pattern in production apps.

import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// io() creates the connection immediately when this module is imported.
// 'autoConnect: false' means it won't connect until we call socket.connect()
// This gives us control over when the connection starts.
const socket = io(SOCKET_URL, {
  autoConnect: false,  // We'll connect manually when user joins a room
  reconnectionAttempts: 5,
  reconnectionDelay: 1000, // Wait 1s between reconnect attempts
});
socket.on('connect', () => console.log('🟢 Socket connected:', socket.id));
socket.on('disconnect', (reason) => console.log('🔴 Socket disconnected:', reason));
socket.on('connect_error', (err) => console.error('Socket error:', err.message));

export default socket;