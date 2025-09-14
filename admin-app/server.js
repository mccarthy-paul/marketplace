import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Import database connection
import connectDB from '../api/db/index.js';

// Import admin routes
import adminAuthRouter from './routes/adminAuth.js';
import adminWatchesRouter from './routes/adminWatches.js';
import adminUsersRouter from './routes/adminUsers.js';
import adminProxyRouter from './routes/adminProxy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS configuration for admin app
app.use(cors({
  origin: ['http://localhost:5174', 'https://admin.a2842d04cca8.ngrok-free.app'],
  credentials: true
}));

// Middleware
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'admin-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
}));

// Admin routes
app.use('/api/admin', adminAuthRouter);
app.use('/api/admin/watches', adminWatchesRouter);
app.use('/api/admin/users', adminUsersRouter);
app.use('/api/admin', adminProxyRouter);

// Serve static files from admin build
app.use(express.static(path.join(__dirname, 'dist')));

// Serve images from the main app's images directory
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

// Serve admin routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/watches', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/users', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Admin authentication middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.is_admin) {
    next();
  } else {
    res.status(401).json({ message: 'Admin access required' });
  }
}

// Protected admin API endpoint
app.get('/api/admin/status', requireAdmin, (req, res) => {
  res.json({ 
    authenticated: true, 
    isAdmin: true,
    user: req.session.user 
  });
});

// Start server
connectDB().then(() => {
  app.listen(8002, '0.0.0.0', () => {
    console.log('🔐 Admin server listening on 0.0.0.0:8002');
    console.log('💻 Admin interface: http://localhost:5174 (dev) or http://localhost:8002 (production)');
  });
});