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

import authCallbackRouter from './routes/authCallback.js';
import watchesRouter from './routes/watches.js';
import listingsRouter from './routes/listings.js';
import ordersRouter from './routes/orders.js';
import usersRouter from './routes/users.js';
import bidsRouter from './routes/bids.js';
import adminAuthRouter from './routes/adminAuth.js'; // Import adminAuth router
import cors from 'cors';


const app = express();

// Add CORS middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
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
app.use('/api/admin', adminAuthRouter); // Mount adminAuth router

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
  res.redirect('http://localhost:5173/dashboard'); // or wherever
});

app.get('/api/me', isAuthenticated, (req, res) => {
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

connectDB().then(() => {
  app.listen(8001, () => console.log('API listening on 8001'));
});
