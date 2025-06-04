// routes/authCallback.js   – attach to your marketplace Express app
console.log('authCallback.js EXECUTING');
import express from 'express';
import session from 'express-session';
import fetch from 'node-fetch'; // pnpm add node-fetch@3
import qs from 'node:querystring';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import User from '../db/userModel.js';

const router = express.Router();

console.log('authCallback.js loaded');

// middleware that parses cookies for the stored `state` value
import cookieParser from 'cookie-parser';
router.use(cookieParser());

console.log('authCallback.js loaded');  

// if you use express-session add it before this route so `req.session` exists
// import session from 'express-session';
// app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: true }));

router.get('/callback', async (req, res, next) => {
  try {
    console.log('↪ callback hit',
  'query.state =', req.query.state,
  'session.state =', req.session?.oauthState);

    const { code, state } = req.query;

    /* ---------- 1.  State check (CSRF) ---------- */
    const expectedState = req.cookies.oauth_state;
    //if (!state || state !== expectedState) {
    //  return res.status(400).send('OAuth state mismatch – try logging in again.');
    //}
    // tidy up
    //res.clearCookie('oauth_state');

    /* ---------- 2.  Exchange the code for tokens ---------- */
    const tokenEndpoint = 'http://localhost:8000/oidc/token';
    console.log("Clinet Id:", process.env.JUNO_CLIENT_ID );
    console.log("Clinet Secret:", process.env.JUNO_CLIENT_SECRET);

    const tokenRes = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        // Basic auth:  client_id:client_secret   (Base64)
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
        // code_verifier: req.cookies.pkce_verifier   // ← add when you enable PKCE
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Token error:', err);
      return res.status(502).send('Failed to exchange code for tokens.');
    }

    const tokenSet = await tokenRes.json();
    /* tokenSet = {
         access_token, id_token, refresh_token?, expires_in, token_type
       } */

    /* ---------- 3.  Persist & redirect ---------- */
    req.session.accessToken  = tokenSet.access_token;
    req.session.idToken      = tokenSet.id_token;
    req.session.refreshToken = tokenSet.refresh_token; // may be undefined

    console.log('Access token:', tokenSet.access_token);
    console.log('ID token:', tokenSet.id_token);
    console.log('Refresh token:', tokenSet.refresh_token);
    console.log('Token expires in:', tokenSet.expires_in, 'seconds');

    // Hardcode user info for testing
    const userInfo = {
      sub: 'paul.mccarthy@badbeat.com', // Using email as sub for uniqueness
      email: 'paul.mccarthy@badbeat.com',
      name: 'Paul McCarthy',
      company_name: 'big Picture Software', // Add company name
    };
    const juno_id = userInfo.sub; // Using sub as the unique Juno ID
    const email = userInfo.email;
    const name = userInfo.name;
    const company_name = userInfo.company_name;

    // Check if user exists, create if not
    let user = await findUserByJunoId(juno_id);
    if (!user) {
      user = await createUser(juno_id, email, name, company_name); // Pass company_name
    }

    req.session.user = user; // Store user in session

    res.redirect('http://localhost:5173/loggedin'); // front-end SPA route after login
  } catch (err) {
    console.error('Error in /auth/juno/callback:', err);
    next(err);
  }
});

// Helper functions for user creation and retrieval
async function createUser(juno_id, email, name, company_name) { // Add company_name parameter
  const newUser = new User({ juno_id, email, name, company_name, is_admin: false }); // Use company_name
  await newUser.save();
  console.log('Creating user:', newUser);
  return newUser;
}

async function findUserByJunoId(juno_id) {
  const user = await User.findOne({ juno_id });
  console.log('Finding user by Juno ID:', juno_id, user);
  return user;
}

router.get('/login', (req, res) => {
  
  const state = crypto.randomBytes(12).toString('hex');
   console.log('↪ login helper',
  'generated state =', state);

  req.session.oauthState = state;

  const redirectUri = encodeURIComponent(
    'http://localhost:8001/auth/juno/callback',
  );

  res.redirect(
    `http://localhost:8000/oidc/auth` +
      `?client_id=marketplace-ui` +
      `&response_type=code` +
      `&redirect_uri=${redirectUri}` +
      `&scope=openid` +
      `&state=${state}`,
  );
});

export default router;
