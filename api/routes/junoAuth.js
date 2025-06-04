// api/routes/junoAuth.js
import { Router } from 'express';
import crypto from 'node:crypto';

const router = Router();

//  /auth/juno/login  – starts the OAuth flow
router.get('/login', (req, res) => {

    
    console.log('↪ login helper',
  'generated state =', state);

  const state = crypto.randomBytes(12).toString('hex');
  req.session.oauthState = state;

  const redirectUri = encodeURIComponent(
    'http://localhost:4001/auth/juno/callback',
  );

  res.redirect(
    `http://localhost:4000/oidc/auth` +
      `?client_id=marketplace-ui` +
      `&response_type=code` +
      `&redirect_uri=${redirectUri}` +
      `&scope=openid` +
      `&state=${state}`,
  );
});

//  /auth/juno/callback  – (already written) exchanges code for tokens
export default router;
