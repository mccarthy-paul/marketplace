// routes/loginWithJuno.js
router.get('/login', (req, res) => {
  const state = crypto.randomBytes(12).toString('hex');
  req.session.oauthState = state;

  const redirectUri = encodeURIComponent(
    'http://localhost:4001/auth/juno/callback');
  res.redirect(
    `http://localhost:4000/oidc/auth?client_id=marketplace-ui&` +
    `response_type=code&redirect_uri=${redirectUri}&scope=openid&state=${state}`);
});
