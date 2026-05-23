// objectHandlers.js
// Relay object events to everyone in the room.
// Also stores objects in memory per room so new joiners
// get existing objects. (Phase 7 will move this to MongoDB)

// In-memory room objects store
// { roomId: { objectId: objectData } }
const roomObjects = {};

module.exports = function objectHandlers(io, socket) {

  // New user joined — send them existing objects
  socket.on('request-objects', () => {
    const objs = roomObjects[socket.roomId] || {};
    socket.emit('room-objects', objs);
  });

  // User added an object
  socket.on('object-add', (obj) => {
    if (!socket.roomId) return;

    // Store in memory
    if (!roomObjects[socket.roomId]) {
      roomObjects[socket.roomId] = {};
    }
    roomObjects[socket.roomId][obj.id] = obj;

    // Broadcast to others
    socket.to(socket.roomId).emit('object-added', obj);
  });

  // User updated an object (moved, resized, edited)
  socket.on('object-update', ({ id, updates }) => {
    if (!socket.roomId) return;

    // Update in memory
    if (roomObjects[socket.roomId]?.[id]) {
      roomObjects[socket.roomId][id] = {
        ...roomObjects[socket.roomId][id],
        ...updates,
      };
    }

    socket.to(socket.roomId).emit('object-updated', { id, updates });
  });

  // User deleted an object
  socket.on('object-remove', ({ id }) => {
    if (!socket.roomId) return;

    if (roomObjects[socket.roomId]) {
      delete roomObjects[socket.roomId][id];
    }

    socket.to(socket.roomId).emit('object-removed', { id });
  });

  // Board cleared
  socket.on('clear-objects', () => {
    if (!socket.roomId) return;
    roomObjects[socket.roomId] = {};
    socket.to(socket.roomId).emit('objects-cleared');
  });

  // Cleanup when room is empty
  socket.on('disconnecting', () => {
    if (!socket.roomId) return;
    const room = io.sockets.adapter.rooms.get(socket.roomId);
    // If only this socket is left, room will be empty after disconnect
    if (room && room.size === 1) {
      delete roomObjects[socket.roomId];
    }
  });
};