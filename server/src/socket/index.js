// socket/index.js
// This is the "hub" for all Socket.IO logic.
// We initialize Socket.IO here and wire up event handlers from
// separate files. This keeps this file short and each handler file focused.

const { Server } = require('socket.io');
const roomHandlers = require('./roomHandlers');
const drawingHandlers = require('./drawingHandlers');
const cursorHandlers = require('./cursorHandlers');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
    // pingTimeout: how long to wait before declaring a client dead
    // pingInterval: how often to send a ping to check if client is alive
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // io.on('connection') fires every time a new browser connects
  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // Each handler file gets (io, socket) so it can:
    // - io.to(room).emit() → send to everyone in a room
    // - socket.emit()      → send to just this user
    // - socket.broadcast   → send to everyone EXCEPT this user
    roomHandlers(io, socket);
    drawingHandlers(io, socket);
    cursorHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`❌ User disconnected: ${socket.id} | Reason: ${reason}`);
    });
  });

  return io;
}

module.exports = { initSocket };