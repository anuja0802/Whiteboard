const Board = require('../models/Board');

module.exports = function historyHandlers(io, socket) {

  socket.on('history-undo', async ({ command }) => {
    if (!socket.roomId) return;
    socket.to(socket.roomId).emit('history-undo', { command });

    try {
      if (command.type === 'stroke-add') {
        const result = await Board.findOneAndUpdate(
          { roomId: socket.roomId },
          [{
            $set: {
              strokes: {
                $filter: {
                  input: '$strokes',
                  cond: { $ne: ['$$this.id', command.stroke.id] }
                }
              }
            }
          }],
          { updatePipeline: true }
        );
      }

      else if (command.type === 'stroke-remove') {
        await Board.findOneAndUpdate(
          { roomId: socket.roomId },
          { $push: { strokes: command.stroke } },
          { upsert: true }
        );
      }

      else if (command.type === 'object-add') {
        // Use Map.delete() for reliable removal
        const board = await Board.findOne({ roomId: socket.roomId });
        if (board) {
          board.objects.delete(command.object.id);
          board.markModified('objects');
          await board.save();
        }
      }

      else if (command.type === 'object-remove') {
        const board = await Board.findOne({ roomId: socket.roomId });
        if (board) {
          board.objects.set(command.object.id, command.object);
          board.markModified('objects');
          await board.save();
        }
      }

      else if (command.type === 'object-update') {
        const setFields = {};
        Object.keys(command.before).forEach(key => {
          setFields[`objects.${command.id}.${key}`] = command.before[key];
        });
        await Board.findOneAndUpdate(
          { roomId: socket.roomId },
          { $set: setFields }
        );
      }

    } catch (err) {
      console.error('UNDO DB error:', err.message);
    }
  });

  socket.on('history-redo', async ({ command }) => {
    if (!socket.roomId) return;
    socket.to(socket.roomId).emit('history-redo', { command });

    try {
      if (command.type === 'stroke-add') {
        await Board.findOneAndUpdate(
          { roomId: socket.roomId },
          { $push: { strokes: command.stroke } },
          { upsert: true }
        );
      }

      else if (command.type === 'stroke-remove') {
        await Board.findOneAndUpdate(
          { roomId: socket.roomId },
          [{
            $set: {
              strokes: {
                $filter: {
                  input: '$strokes',
                  cond: { $ne: ['$$this.id', command.stroke.id] }
                }
              }
            }
          }],
          { updatePipeline: true }
        );
      }

      else if (command.type === 'object-add') {
        // Use Map.set() for reliable addition
        const board = await Board.findOne({ roomId: socket.roomId });
        if (board) {
          board.objects.set(command.object.id, command.object);
          board.markModified('objects');
          await board.save();
        }
      }

      else if (command.type === 'object-remove') {
        const board = await Board.findOne({ roomId: socket.roomId });
        if (board) {
          board.objects.delete(command.object.id);
          board.markModified('objects');
          await board.save();
        }
      }

      else if (command.type === 'object-update') {
        const setFields = {};
        Object.keys(command.after).forEach(key => {
          setFields[`objects.${command.id}.${key}`] = command.after[key];
        });
        await Board.findOneAndUpdate(
          { roomId: socket.roomId },
          { $set: setFields }
        );
      }

    } catch (err) {
      console.error('REDO DB error:', err.message);
    }
  });
};