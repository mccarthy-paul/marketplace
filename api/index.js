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

import authCallbackRouter from './routes/authCallback.js';
import watchesRouter from './routes/watches.js';
import listingsRouter from './routes/listings.js';
import ordersRouter from './routes/orders.js';
import usersRouter from './routes/users.js';
import bidsRouter from './routes/bids.js';
import chatRouter from './routes/chat.js'; // Import chat router
import junopayAuthRouter from './routes/junopayAuth.js'; // Import JunoPay auth router
import junopayRouter from './routes/junopay.js'; // Import JunoPay API router
import adminRouter from './routes/admin.js'; // Import admin router
import cors from 'cors';


const app = express();

// Add CORS middleware
app.use(cors({
  origin: ['https://4c153d847f98.ngrok-free.app', 'http://localhost:8002', 'http://localhost:5174'],
  credentials: true // Allow cookies to be sent
}));

// Middleware to parse JSON bodies
app.use(express.json());

// PMC TESTING REMOVE
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: {
    sameSite: 'lax',
    httpOnly: true,
 },
}));

app.use('/auth/juno', authCallbackRouter);
app.use('/api/watches', watchesRouter);
app.use('/api/listings', listingsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/users', usersRouter);
app.use('/api/bids', bidsRouter);
app.use('/api/chat', chatRouter); // Mount chat router
app.use('/auth/junopay', junopayAuthRouter); // Mount JunoPay auth router
app.use('/api/junopay', junopayRouter); // Mount JunoPay API router
app.use('/api/admin', adminRouter); // Mount admin router

// Serve static files from the frontend build
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Serve images from the images directory
app.use('/images', express.static(path.join(__dirname, '..', 'images')));

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
  res.redirect('https://4c153d847f98.ngrok-free.app/dashboard'); // or wherever
});

app.get('/api/me', isAuthenticated, (req, res) => {
  console.log('Direct /api/me endpoint hit - user:', req.session.user);
  res.json({ user: req.session.user });
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

connectDB().then(() => {
  app.listen(8001, '0.0.0.0', () => console.log('API listening on 0.0.0.0:8001'));
});
