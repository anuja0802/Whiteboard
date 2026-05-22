module.exports = function drawingHandlers(io, socket) {
  socket.on('draw-stroke', (data) => {
    if (!socket.roomId) return;
    // Relay immediately — no processing, pure passthrough
    socket.to(socket.roomId).emit('stroke-received', data);
  });

  socket.on('clear-canvas', () => {
    if (!socket.roomId) return;
    socket.to(socket.roomId).emit('canvas-cleared');
  });
};