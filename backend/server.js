const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  }
});

// Pass io to express app so controllers can access it via req.app.get('io')
app.set('io', io);

// Socket setup
require('./socket/index')(io);

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/', (req, res) => {
  res.json({ message: 'LifeLink API is running' });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/hospitals', require('./routes/hospitals'));
app.use('/api/bloodbanks', require('./routes/bloodBanks'));
app.use('/api/donors', require('./routes/donors'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/blood-requests', require('./routes/bloodRequests'));
app.use('/api/camps', require('./routes/donationCamps'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5000;

// Periodic cleanup for expired reservations (runs every 60s)
const { checkExpiredReservations } = require('./controllers/reservationController');
setInterval(() => {
  checkExpiredReservations(io);
}, 60000);

// Autonomous Blood Dispatch & Escalation Agent (monitors active broadcasts every 60s)
const { runAutonomousMonitoringLoop } = require('./utils/autonomousDispatchAgent');
setInterval(() => {
  runAutonomousMonitoringLoop(io);
}, 60000);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
