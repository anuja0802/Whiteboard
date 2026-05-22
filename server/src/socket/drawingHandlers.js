// drawingHandlers.js
// The server's job here is simple: receive a stroke from one user
// and immediately broadcast it to everyone else in the same room.
// The server does NOT store strokes yet (that's Phase 7 - MongoDB).
// It's a pure relay for now.

module.exports = function drawingHandlers(io, socket) {
  // Relay the full stroke object to everyone else in the room
  socket.on('draw-stroke', (stroke) => {
    if (!socket.roomId) return;
    socket.to(socket.roomId).emit('stroke-received', stroke);
  });

  socket.on('clear-canvas', () => {
    if (!socket.roomId) return;
    socket.to(socket.roomId).emit('canvas-cleared');
  });
};