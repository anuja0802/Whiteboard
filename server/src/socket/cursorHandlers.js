// cursorHandlers.js
module.exports = function cursorHandlers(io, socket) {
  socket.on('cursor-move', (data) => {
    socket.to(socket.roomId).emit('cursor-updated', {
      userId: socket.id,
      username: socket.username,
      ...data,
    });
  });
};