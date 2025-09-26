import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import fetch from 'node-fetch';
import qs from 'node:querystring';
import dotenv from 'dotenv';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
dotenv.config();

import connectDB from './db/index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Essential import for JunoPay authentication
import junopayAuthRouter from './routes/junopayAuth.js'; // Import JunoPay auth router

// Re-enable essential imports
import watchesRouter from './routes/watches.js';
import junopayRouter from './routes/junopay.js';
import usersRouter from './routes/users.js';

// Keep these commented out for now
// import authCallbackRouter from './routes/authCallback.js';
// import listingsRouter from './routes/listings.js';
// import ordersRouter from './routes/orders.js';
// import bidsRouter from './routes/bids.js';
// import chatRouter from './routes/chat.js';
// import adminRouter from './routes/admin.js';
// import cartRouter from './routes/cart.js';
// import dataSpecialistRouter from './routes/dataSpecialist.js';
// import notificationsRouter from './routes/notifications.js';
// import analyticsRouter from './routes/analytics.js';
// import sellersRouter from './routes/sellers.js';
// import bulkUploadRouter from './routes/bulkUpload.js';
// import searchRouter from './routes/search.js';
import cors from 'cors';


const app = express();

// Add CORS middleware with dynamic configuration
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : [
    'https://frontend-xio7lz2d5a-uc.a.run.app',
    'https://juno-marketplace-admin.netlify.app',
    'https://frabjous-muffin-21b429.netlify.app',
    'http://localhost:8002',
    'http://localhost:5174',
    'http://localhost:5173'
  ];

app.use(cors({
  origin: corsOrigins,
  credentials: true // Allow cookies to be sent
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Trust proxy for production environments
app.set('trust proxy', 1);

app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'none', // Allow cross-site cookies for production
    secure: true, // Required for sameSite: 'none'
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Essential routes for JunoPay authentication
app.use('/auth/junopay', junopayAuthRouter); // Mount JunoPay auth router

// Re-enable essential routes
app.use('/api/watches', watchesRouter);
app.use('/api/junopay', junopayRouter);
app.use('/api/users', usersRouter);

// Keep these commented out for now
// app.use('/auth/juno', authCallbackRouter);
// app.use('/api/listings', listingsRouter);
// app.use('/api/orders', ordersRouter);
// app.use('/api/bids', bidsRouter);
// app.use('/api/chat', chatRouter);
// app.use('/api/admin', adminRouter);
// app.use('/api/cart', cartRouter);
// app.use('/api/data', dataSpecialistRouter);
// app.use('/api/notifications', notificationsRouter);
// app.use('/api/analytics', analyticsRouter);
// app.use('/api/sellers', sellersRouter);
// app.use('/api/bulk-upload', bulkUploadRouter);
// app.use('/api/search', searchRouter);

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Serve images from the public/images directory (now inside api/)
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));

// Serve uploaded files from the public directory
app.use('/public', express.static(path.join(__dirname, 'public')));

app.get('/auth/juno/callback', async (req, res) => {
  const { code, state } = req.query;

  // TODO: verify state with cookie/storage
  const tokenRes = await fetch('http://localhost:4000/oidc/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization':
        'Basic ' +
        Buffer.from(
          process.env.JUNO_CLIENT_ID + ':' + process.env.JUNO_CLIENT_SECRET,
        ).toString('base64'),
    },
    body: qs.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: 'http://localhost:8001/auth/juno/callback',
    }),
  });

  const tokenSet = await tokenRes.json();
  req.session.accessToken = tokenSet.access_token;
  res.redirect('https://frontend-xio7lz2d5a-uc.a.run.app/dashboard'); // or wherever
});

app.get('/api/me', isAuthenticated, (req, res) => {
  console.log('Direct /api/me endpoint hit - user:', req.session.user);
  res.json({ user: req.session.user });
});

// Debug endpoint to check session without auth
app.get('/api/session-check', (req, res) => {
  console.log('Session check - Full session:', req.session);
  console.log('Session check - User:', req.session?.user);
  console.log('Session check - Session ID:', req.sessionID);
  res.json({ 
    hasSession: !!req.session,
    hasUser: !!req.session?.user,
    sessionId: req.sessionID,
    user: req.session?.user || null
  });
});

/* 2️⃣  logout  ──────────────────────────────────────────────────*/
app.post('/auth/logout', (req, res) => {
  // Clear server-side cookies
  res.clearCookie('connect.sid', { path: '/' }); // Clear the session cookie (adjust name/path if needed)
  res.clearCookie('oauth_state', { path: '/' }); // Clear the oauth_state cookie (adjust path if needed)

  req.session.destroy(() => {
    // Redirect to the home page after destroying the session
    res.redirect('/');
  });
});

// Sample route for testing
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  console.log('isAuthenticated middleware: req.session.user:', req.session?.user);
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Example protected route
// PMC TEST COMMENT OUT
//app.get('/api/protected', isAuthenticated, (req, res) => {
//  console.log('Reached /api/protected route');
//  res.json({ message: 'You are authorized!', user: req.session.user });
//});

// Serve React app for specific frontend routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.get('/loggedin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.get('/watches', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.get('/my-watch-bids', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.get('/orders', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.get('/admin/orders', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.get('/admin/bids', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.get('/admin/orders/:orderId', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.get('/admin/bids/:bidId', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8001;

// Start server immediately
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API listening on 0.0.0.0:${PORT}`);

  // Connect to database after server starts
  connectDB().then((connected) => {
    if (connected) {
      console.log('API server started with database connection');
    } else {
      console.log('API server started without database connection (will retry automatically)');
    }
  });
});
