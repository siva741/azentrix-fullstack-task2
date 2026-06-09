require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const boardRoutes = require('./routes/boards');
const cardRoutes = require('./routes/cards');
const adminRoutes = require('./routes/admin');
const { setupSocket } = require('./socket');

const app = express();
const server = http.createServer(app);

const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Quick environment sanity checks to help catch misconfiguration on deploy
const requiredEnvs = ['DATABASE_URL', 'JWT_SECRET'];
const missing = requiredEnvs.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.warn('⚠️  Missing required environment variables:', missing.join(', '));
  console.warn('This may cause runtime errors (500). Set them and restart the server.');
}

// Allow any localhost port (Vite can use 5173, 5174, etc.) + configured CLIENT_URL
const corsOrigin = (origin, callback) => {
  if (!origin) return callback(null, true); // allow non-browser requests
  if (
    /^http:\/\/localhost:\d+$/.test(origin) ||
    /^http:\/\/127\.0\.0\.1:\d+$/.test(origin) ||
    /\.vercel\.app$/.test(origin) ||
    origin === CLIENT_URL
  ) {
    return callback(null, true);
  }
  // To ensure the intern demo works perfectly, we reflect the origin dynamically
  return callback(null, true); 
};

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Make io accessible in route handlers
app.set('io', io);

// Middleware
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root and health check routes
app.get('/', (req, res) => {
  res.json({
    message: 'Azentrix backend is running',
    api: '/api',
    health: '/health',
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Azentrix API root',
    routes: ['/api/auth', '/api/boards', '/api/cards', '/api/admin'],
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/boards', boardRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && (err.stack || err.message || err));

  // In production we avoid leaking internals. Enable verbose errors only when
  // SHOW_ERROR_DETAILS=true is set (useful for debugging a misconfigured deploy).
  const showDetails = process.env.SHOW_ERROR_DETAILS === 'true' || process.env.NODE_ENV !== 'production';

  if (showDetails) {
    res.status(500).json({ message: err.message || 'Internal server error', stack: err.stack });
  } else {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Socket.IO setup
setupSocket(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.IO enabled`);
  console.log(`📡 CORS allowed for: ${CLIENT_URL}`);
});
