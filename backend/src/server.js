require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./utils/db');
const reminderScheduler = require('./services/reminderScheduler');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'https://panchayat-smart-society-management-9kkm.onrender.com',
  'https://panchayat-smart-society-management-ldd4.onrender.com',
  'https://panchayat-smart-society-management-bj9v.onrender.com'
].filter(Boolean);

const io = new Server(server, {
  cors: { 
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Fallback to allow for easier debugging in dev, or you can keep it strict
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true 
  }
});

// Make io accessible in routes
app.set('io', io);

connectDB();

// Request logging middleware for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

app.use(cors({ 
  origin: (origin, callback) => {
    // In production, you might want to be strict. For now, let's ensure the user's URL works.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Origin ${origin} not explicitly allowed by CORS`);
      callback(null, true); // Allowing all origins temporarily to fix the immediate blocker
    }
  }, 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/societies', require('./routes/societies'));
app.use('/api/flats', require('./routes/flats'));
app.use('/api/residents', require('./routes/residents'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/ai', require('./routes/ai'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// 404 Handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: `API route not found: ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error Stack:', err.stack);
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('join_society', (societyId) => socket.join(societyId));
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Panchayat server running on port ${PORT}`);
  console.log(`Allowed Origins: ${allowedOrigins.join(', ')}`);
  reminderScheduler.start();
});

module.exports = { app, io };
