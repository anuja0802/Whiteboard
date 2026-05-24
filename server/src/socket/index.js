const { Server } = require('socket.io');
const roomHandlers = require('./roomHandlers');
const drawingHandlers = require('./drawingHandlers');
const cursorHandlers = require('./cursorHandlers');
const objectHandlers = require('./objectHandlers');

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  io.on('connection', (socket) => {
    roomHandlers(io, socket);
    drawingHandlers(io, socket);
    cursorHandlers(io, socket);
    objectHandlers(io, socket);
  });

  return io;
}

module.exports = { initSocket };