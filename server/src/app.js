// app.js
// Express is just a request router. We keep it separate from the 
// server itself so we can test routes without starting a real server.

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// CORS: Allow our React dev server to talk to this backend.
// In production, replace CLIENT_URL with your actual domain.
// Without this, browsers block cross-origin requests (security feature).
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true, // Allow cookies if needed later
}));

// Parse incoming JSON request bodies
app.use(express.json());

// Health check — always useful for debugging deploys
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes (we'll fill these in Phase 7)
// app.use('/api/boards', require('./routes/boards'));

module.exports = app;