require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./utils/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

connectDB();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/residents', require('./routes/residents'));
app.use('/api/societies', require('./routes/societies'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/flats', require('./routes/flats'));
app.use('/api/ai', require('./routes/ai'));

io.on('connection', (socket) => {
  socket.on('join_society', (societyId) => socket.join(societyId));
});
app.set('io', io);

app.use((err, req, res, next) => {
  res.status(500).json({ success: false, message: err.message });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
