const Board = require('../models/Board');

module.exports = function roomHandlers(io, socket) {

  socket.on('join-room', async ({ roomId, username }) => {
    // Prevent joining same room twice on same socket
    if (socket.roomId === roomId) return;

    socket.join(roomId);
    socket.roomId = roomId;
    socket.username = username;

    socket.to(roomId).emit('user-joined', { userId: socket.id, username });

    const room = io.sockets.adapter.rooms.get(roomId);
    const usersInRoom = [];
    if (room) {
      room.forEach((socketId) => {
        const s = io.sockets.sockets.get(socketId);
        if (s && s.id !== socket.id) {
          usersInRoom.push({ userId: s.id, username: s.username });
        }
      });
    }
    socket.emit('room-users', usersInRoom);

    try {
      const board = await Board.findOne({ roomId });
      if (board) {
        socket.emit('board-state', {
          strokes: board.strokes,
          objects: board.getObjectsAsPlain(),
        });
      }
    } catch (err) {
      // silent
    }
  });

  socket.on('disconnecting', () => {
    if (socket.roomId) {
      socket.to(socket.roomId).emit('user-left', {
        userId: socket.id,
        username: socket.username,
      });
    }
  });
};