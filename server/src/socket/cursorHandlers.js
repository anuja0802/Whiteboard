// cursorHandlers.js
// Simple relay — receive cursor position from one user,
// broadcast to everyone else in the room.
// We also include the username so the cursor label shows the right name.

module.exports = function cursorHandlers(io, socket) {
  socket.on('cursor-move', (data) => {
    if (!socket.roomId) return;

    // Relay to everyone else in the room
    socket.to(socket.roomId).emit('cursor-updated', {
      userId: socket.id,
      username: socket.username,
      x: data.x,  // world coordinates
      y: data.y,
    });
  });

  // When user leaves, tell others to remove their cursor
  socket.on('disconnecting', () => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('cursor-removed', {
        userId: socket.id,
      });
    }
  });
};