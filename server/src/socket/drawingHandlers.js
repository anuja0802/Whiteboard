const Board = require('../models/Board');

function debounce(fn, delay) {
  const timers = {};
  return function(roomId, ...args) {
    clearTimeout(timers[roomId]);
    timers[roomId] = setTimeout(() => {
      fn(roomId, ...args);
      delete timers[roomId];
    }, delay);
  };
}

const strokeBuffer = {};

async function flushStrokes(roomId) {
  const strokes = strokeBuffer[roomId];
  if (!strokes || strokes.length === 0) return;
  strokeBuffer[roomId] = [];

  try {
    await Board.findOneAndUpdate(
      { roomId },
      {
        $push: { strokes: { $each: strokes } },
        $set: { lastActiveAt: new Date() },
      },
      {
        upsert: true,
        returnDocument: 'after', // fixes Mongoose deprecation warning
      }
    );
  } catch (err) {
    strokeBuffer[roomId] = [...strokes, ...(strokeBuffer[roomId] || [])];
  }
}

const debouncedFlush = debounce(flushStrokes, 2000);

module.exports = function drawingHandlers(io, socket) {

  socket.on('draw-stroke', (data) => {
    if (!socket.roomId) return;
    socket.to(socket.roomId).emit('stroke-received', data);

    if (data.type === 'end' && data.stroke) {
      if (!strokeBuffer[socket.roomId]) strokeBuffer[socket.roomId] = [];
      strokeBuffer[socket.roomId].push(data.stroke);
      debouncedFlush(socket.roomId);
    }
  });

  socket.on('clear-canvas', async () => {
    if (!socket.roomId) return;
    socket.to(socket.roomId).emit('canvas-cleared');
    strokeBuffer[socket.roomId] = [];

    try {
      await Board.findOneAndUpdate(
        { roomId: socket.roomId },
        { $set: { strokes: [], lastActiveAt: new Date() } },
        { upsert: true }
      );
    } catch (err) {
      // silent
    }
  });
};