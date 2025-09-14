// routes/authCallback.js   – attach to your marketplace Express app
console.log('authCallback.js EXECUTING');
import express from 'express';
import session from 'express-session';
import fetch from 'node-fetch'; // pnpm add node-fetch@3
import qs from 'node:querystring';
import crypto from 'node:crypto';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken'; // Import jsonwebtoken
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
  console.log('--- Start of /auth/juno/callback ---');
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

    console.log('--- After state check ---');

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

    console.log('--- After token exchange ---');

    /* ---------- 3.  Persist & redirect ---------- */
    req.session.accessToken  = tokenSet.access_token;
    req.session.idToken      = tokenSet.id_token;
    req.session.refreshToken = tokenSet.refresh_token; // may be undefined

    console.log('Access token:', tokenSet.access_token);
    console.log('ID token:', tokenSet.id_token);
    console.log('Refresh token:', tokenSet.refresh_token);
    console.log('Token expires in:', tokenSet.expires_in, 'seconds');

    // Decode the ID token to get user information
    const decodedIdToken = jwt.decode(tokenSet.id_token);
    console.log('Decoded ID Token:', decodedIdToken);

    const juno_id = decodedIdToken.sub; // Use 'sub' as the unique Juno ID
    const email = decodedIdToken.email;
    const name = decodedIdToken.name;
    const company_name = decodedIdToken.company_name; // Assuming 'company_name' is a claim in the ID token

console.log('Decoded ID Token juno_id:', juno_id);
console.log('Decoded ID Token email:', email);
console.log('Decoded ID Token:', name);
console.log('Decoded ID Token:', company_name);

    // Check if user exists, create if not
    let user = await findUserByJunoId(juno_id);
    if (!user) {
      // Log a warning if required fields are missing from the ID token
      if (!email || !name || !company_name) {
        console.warn(`Missing required fields in ID token for juno_id: ${juno_id}. Email: ${email}, Name: ${name}, Company Name: ${company_name}`);
      }
      user = await createUser(juno_id, email, name, company_name); // Pass company_name
    }

    req.session.user = user; // Store user in session

    // Redirect to the loggedin page, including the id_token as a query parameter
    // Use the origin from the request or fallback to localhost
    const origin = req.get('origin') || req.get('referer') || 'https://a2842d04cca8.ngrok-free.app';
    const baseUrl = origin.includes('ngrok') ? 'https://a2842d04cca8.ngrok-free.app' : 'http://localhost:5173';
    res.redirect(`${baseUrl}/loggedin?id_token=${tokenSet.id_token}`); // front-end SPA route after login
  } catch (err) {
    console.error('Error in /auth/juno/callback:', err);
    // Send a more detailed error response
    res.status(500).json({ 
      error: 'Authentication failed', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

// Helper functions for user creation and retrieval
async function createUser(juno_id, email, name, company_name) {
  // Add checks for required fields before creating the user
  if (!email) {
    console.warn(`Email is missing for user with juno_id: ${juno_id}. Using a placeholder.`);
  }
  if (!name) {
    console.warn(`Name is missing for user with juno_id: ${juno_id}. Using a placeholder.`);
  }
  if (!company_name) {
    console.warn(`Company name is missing for user with juno_id: ${juno_id}. Using a placeholder.`);
  }

  const newUser = new User({
    juno_id,
    email: email || `${juno_id}@junomoney.com`, // Use email param or generate from juno_id
    name: name || 'JunoPay User', // Use name param or default
    company_name: company_name || 'JunoPay User', // Use company_name param or default
    is_admin: false
  });
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
