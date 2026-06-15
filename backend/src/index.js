require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { connectDB, getMongoUri } = require('./config/db');

const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const cardRoutes = require('./routes/cards');
const taskRoutes = require('./routes/tasks');
const adminRoutes = require('./routes/admin');
const userRoutes = require('./routes/users');
const { setupSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const missing = [];
if (!getMongoUri()) missing.push('MONGODB_URI');
if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
if (missing.length > 0) {
  console.warn('Missing environment variables:', missing.join(', '));
}

const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true);

  if (
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
    /\.vercel\.app$/.test(origin) ||
    origin === CLIENT_URL
  ) {
    return callback(null, true);
  }

  return callback(null, true);
};

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

app.set('io', io);

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  res.on('finish', () => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - Status: ${res.statusCode}`);
  });
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'TaskFlow API is running',
    api: '/api',
    health: '/health',
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'TaskFlow API root',
    routes: ['/api/auth', '/api/boards', '/api/tasks', '/api/cards', '/api/users', '/api/admin'],
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && (err.stack || err.message || err));

  const showDetails = process.env.SHOW_ERROR_DETAILS === 'true' || process.env.NODE_ENV !== 'production';
  if (showDetails) {
    return res.status(500).json({ message: err.message || 'Internal server error', stack: err.stack });
  }

  res.status(500).json({ message: 'Internal server error' });
});

setupSocket(io);

const PORT = process.env.PORT || 4000;

connectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log('Socket.IO enabled');
      console.log(`Client URL: ${CLIENT_URL}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });
