const Board = require('../models/Board');

module.exports = function objectHandlers(io, socket) {

  // User joined — objects are now sent via board-state in roomHandlers
  // This is kept as a fallback
  socket.on('request-objects', async () => {
    if (!socket.roomId) return;
    try {
      const board = await Board.findOne({ roomId: socket.roomId });
      if (board) {
        socket.emit('room-objects', board.getObjectsAsPlain());
      } else {
        socket.emit('room-objects', {});
      }
    } catch (err) {
      socket.emit('room-objects', {});
    }
  });

  // Object added
  socket.on('object-add', async (obj) => {
    if (!socket.roomId) return;

    // Relay to others immediately
    socket.to(socket.roomId).emit('object-added', obj);

    // Save to MongoDB
    try {
      await Board.findOneAndUpdate(
        { roomId: socket.roomId },
        {
          $set: {
            [`objects.${obj.id}`]: obj,
            lastActiveAt: new Date(),
          },
        },
        { upsert: true }
      );
    } catch (err) {
      // silent
    }
  });

  // Object updated (moved, resized, text edited)
  socket.on('object-update', async ({ id, updates }) => {
    if (!socket.roomId) return;

    // Relay to others immediately
    socket.to(socket.roomId).emit('object-updated', { id, updates });

    // Build MongoDB dot-notation update
    // e.g. { 'objects.abc123.x': 100, 'objects.abc123.y': 200 }
    try {
      const setFields = { lastActiveAt: new Date() };
      Object.keys(updates).forEach((key) => {
        setFields[`objects.${id}.${key}`] = updates[key];
      });

      await Board.findOneAndUpdate(
        { roomId: socket.roomId },
        { $set: setFields },
        { upsert: true }
      );
    } catch (err) {
      // silent
    }
  });

  // Object removed
  socket.on('object-remove', async ({ id }) => {
    if (!socket.roomId) return;

    // Relay to others immediately
    socket.to(socket.roomId).emit('object-removed', { id });

    // Remove from MongoDB
    try {
      await Board.findOneAndUpdate(
        { roomId: socket.roomId },
        {
          $unset: { [`objects.${id}`]: '' },
          $set: { lastActiveAt: new Date() },
        }
      );
    } catch (err) {
      // silent
    }
  });

  // Clear all objects
  socket.on('clear-objects', async () => {
    if (!socket.roomId) return;

    // Relay to others
    socket.to(socket.roomId).emit('objects-cleared');

    // Clear from MongoDB
    try {
      await Board.findOneAndUpdate(
        { roomId: socket.roomId },
        { $set: { objects: {}, lastActiveAt: new Date() } },
        { upsert: true }
      );
    } catch (err) {
      // silent
    }
  });
};