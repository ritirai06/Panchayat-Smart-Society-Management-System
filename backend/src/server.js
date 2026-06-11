require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./utils/db');

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://panchayat-smart-society-management-voat.onrender.com',
  'https://panchayat-smart-society-management-9kkm.onrender.com',
  'https://panchayat-smart-society-management-system.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

connectDB();

app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/residents', require('./routes/residents'));
app.use('/api/societies', require('./routes/societies'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/flats', require('./routes/flats'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/parking', require('./routes/parking'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/sos', require('./routes/sos'));

// TEMP: Debug — list all users
app.get('/api/seed', async (req, res) => {
  const User = require('./models/User');
  const users = await User.find({}).select('email role name');
  res.json({ count: users.length, users });
});

// TEMP: Seed route — remove after use
app.post('/api/seed', async (req, res) => {
  const User = require('./models/User');
  const Society = require('./models/Society');
  const mongoose = require('mongoose');
  try {
    await User.deleteMany({});
    let society = await Society.findOne({});
    if (!society) {
      society = await Society.create({
        name: 'Panchayat Society', address: '123 Main Street',
        city: 'Mumbai', admin: new mongoose.Types.ObjectId(), maintenanceAmount: 2000
      });
    }
    const admin = await User.create({
      name: 'Riti Admin', email: 'ritiadmin@panchayat.com',
      password: 'riti1234', role: 'admin', society: society._id
    });
    await Society.findByIdAndUpdate(society._id, { admin: admin._id });
    await User.create({
      name: 'Riti Resident', email: 'ritiresident@panchayat.com',
      password: 'riti1234', role: 'resident', society: society._id
    });
    res.json({ success: true, message: 'Seeded: ritiadmin@panchayat.com / riti1234' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

io.on('connection', (socket) => {
  socket.on('join_society', (societyId) => socket.join(societyId));
});

app.set('io', io);

app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Panchayat server running on port ${PORT}`);
  console.log('Allowed Origins:', allowedOrigins.join(', '));
});
