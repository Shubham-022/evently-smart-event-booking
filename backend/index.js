// backend/index.js
import 'dotenv/config'; // Load environment variables
import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { setIo } from './utils/socket.js';

import { testConnection } from './config/db.js';
import userRoutes from './routes/user.js';
import eventsRouter from './routes/events.js';
import bookingsRouter from './routes/bookings.js';
import authRouter from './routes/auth.js';
import adminRouter from './routes/admin.js';
import socketHandler from './sockets/index.js';

const app = express();
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];

// Append configured frontend URLs from environment
if (process.env.FRONTEND_URL) {
  process.env.FRONTEND_URL.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/$/, '');
    if (trimmed && !allowedOrigins.includes(trimmed)) allowedOrigins.push(trimmed);
  });
}
if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/$/, '');
    if (trimmed && !allowedOrigins.includes(trimmed)) allowedOrigins.push(trimmed);
  });
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or same-origin)
    if (!origin) return callback(null, true);

    // Allow listed origins, local dev servers, or any Vercel deployment URL
    if (
      allowedOrigins.includes(origin) ||
      origin.startsWith('http://localhost:') ||
      origin.startsWith('http://127.0.0.1:') ||
      origin.endsWith('.vercel.app')
    ) {
      return callback(null, true);
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check endpoints for Render and uptime monitoring
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'Evently API Backend', uptime: process.uptime() });
});
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.use('/api/users', userRoutes);
app.use('/api/events', eventsRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);

const PORT = process.env.PORT || 5002;

async function startServer() {
  try {
    const dbOk = await testConnection();
    if (!dbOk) throw new Error('Database connection test failed');

    // Automatically run seat allocation & schema migration so cloud deployments
    // always have the required event_seats table, columns, and seat rows
    try {
      const { migrateSeats } = await import('./scripts/migrateSeats.js');
      await migrateSeats();
    } catch (migErr) {
      console.warn('⚠️ Auto seat migration warning:', migErr.message);
    }

    // Automatically update event images with professional photography
    try {
      const { updateEventImages } = await import('./scripts/updateEventImages.js');
      await updateEventImages();
    } catch (imgErr) {
      console.warn('⚠️ Auto image update warning:', imgErr.message);
    }

    const server = http.createServer(app);
    const io = new SocketIOServer(server, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
    });
    // Store Io globally for services
    setIo(io);
    // Initialize Socket.IO after DB is confirmed
    socketHandler(io);
    server.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Server startup error:', err);
    process.exit(1);
  }
}

startServer();
