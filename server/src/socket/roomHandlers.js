// roomHandlers.js
// A "room" in Socket.IO is a named channel. A socket can join
// multiple rooms. When you emit to a room, only sockets IN that
// room receive it. Perfect for our whiteboard rooms.

module.exports = function roomHandlers(io, socket) {

  // Client emits 'join-room' when they navigate to a board URL
  socket.on('join-room', ({ roomId, username }) => {
    // Socket.IO built-in: subscribe this socket to the room channel
    socket.join(roomId);

    // Store roomId on the socket object so we can access it later
    // (e.g. when the user disconnects, we know which room they were in)
    socket.roomId = roomId;
    socket.username = username;

    console.log(`👤 ${username} joined room: ${roomId}`);

    // Tell everyone ELSE in this room a new user arrived
    // socket.to(roomId) = everyone in the room EXCEPT the sender
    socket.to(roomId).emit('user-joined', {
      userId: socket.id,
      username,
    });

    // Build a list of who's already in this room so the new user
    // can render existing cursors immediately
    // io.sockets.adapter.rooms.get(roomId) = Set of socket IDs in room
    const room = io.sockets.adapter.rooms.get(roomId);
    const usersInRoom = [];

    if (room) {
      room.forEach((socketId) => {
        const s = io.sockets.sockets.get(socketId);
        // Don't include the user who just joined in their own list
        if (s && s.id !== socket.id) {
          usersInRoom.push({ userId: s.id, username: s.username });
        }
      });
    }

    // Send ONLY to the connecting user: here's who's already here
    socket.emit('room-users', usersInRoom);
  });

  // When a user disconnects, notify their room
  socket.on('disconnecting', () => {
    // 'disconnecting' fires BEFORE the socket leaves rooms
    // 'disconnect' fires AFTER — by then socket.rooms is empty
    if (socket.roomId) {
      socket.to(socket.roomId).emit('user-left', {
        userId: socket.id,
        username: socket.username,
      });
    }
  });
};