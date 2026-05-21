// drawingHandlers.js
// The server's job here is simple: receive a stroke from one user
// and immediately broadcast it to everyone else in the same room.
// The server does NOT store strokes yet (that's Phase 7 - MongoDB).
// It's a pure relay for now.

module.exports = function drawingHandlers(io, socket) {

  // 'draw-stroke': a single line segment from point A to point B
  socket.on('draw-stroke', (data) => {
    // socket.roomId was set when the user joined (roomHandlers.js)
    if (!socket.roomId) return;

    // Relay to everyone in the room EXCEPT the sender
    // The sender already drew it locally for instant feedback
    socket.to(socket.roomId).emit('stroke-received', data);
  });

  // 'clear-canvas': user cleared their canvas, sync to room
  socket.on('clear-canvas', () => {
    if (!socket.roomId) return;
    socket.to(socket.roomId).emit('canvas-cleared');
  });
};