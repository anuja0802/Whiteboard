// server.js
// We import 'http' from Node's stdlib to create the server manually.
// If we let Express create it internally (app.listen), Socket.IO
// can't attach to it. This is the standard pattern.

const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/socket/index');
const connectDB = require('./src/db/connect');
require('dotenv').config();

const PORT = process.env.PORT || 3001;

async function startServer() {
  // Connect to MongoDB first
  await connectDB();

// Step 1: Create HTTP server wrapping our Express app
const server = http.createServer(app);

// Step 2: Attach Socket.IO to the SAME HTTP server
// Now both REST API and WebSocket live on port 3001
initSocket(server);

// Step 3: Start listening
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

}

startServer();