// drawingHandlers.js
// Phase 3 will fill this in. For now just a shell.
module.exports = function drawingHandlers(io, socket) {
  socket.on('draw-stroke', (data) => {
    // Broadcast stroke to everyone else in the room
    socket.to(socket.roomId).emit('stroke-received', data);
  });
};