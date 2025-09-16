import express from 'express';
import crypto from 'node:crypto';
import fetch from 'node-fetch';
import qs from 'qs';
import User from '../db/userModel.js';

const router = express.Router();

// JunoPay OAuth login - redirect to JunoPay authorization
router.get('/login', (req, res) => {
  console.log('🚀 JunoPay OAuth flow initiated');
  
  // Generate state for CSRF protection
  const state = crypto.randomBytes(12).toString('hex');
  req.session.oauthState = state;
  console.log('↪ Generated state:', state);

  // Build JunoPay authorization URL with prompt=select_account to force account selection
  const params = new URLSearchParams({
    application_id: process.env.JUNO_APPLICATION_ID,
    redirect_uri: process.env.JUNO_REDIRECT_URI || 'http://localhost:8001/auth/junopay/callback',
    secret_key: process.env.JUNO_SECRET_KEY,
    prompt: 'select_account', // Force account selection even if user has active JunoPay session
    timestamp: Date.now() // Add timestamp to prevent caching
  });

  const authorizeUrl = `${process.env.JUNOPAY_AUTHORIZE_URL}?${params.toString()}`;
  console.log('↪ Redirecting to JunoPay:', authorizeUrl);
  
  res.redirect(authorizeUrl);
});

// JunoPay OAuth callback - exchange code for tokens
router.get('/callback', async (req, res) => {
  console.log('--- JunoPay callback received ---');
  console.log('↪ Full query params:', req.query);
  console.log('↪ Session before processing:', JSON.stringify(req.session, null, 2));
  
  try {
    const { code, error } = req.query;
    
    if (error) {
      console.error('OAuth error:', error);
      return res.redirect(`https://a2842d04cca8.ngrok-free.app/?error=${encodeURIComponent(error)}`);
    }

    if (!code) {
      console.error('No authorization code received');
      return res.redirect('https://a2842d04cca8.ngrok-free.app/?error=no_code');
    }

    console.log('↪ Authorization code received:', code);

    // Exchange code for tokens
    const tokenResponse = await fetch(process.env.JUNOPAY_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code: code,
        application_id: process.env.JUNO_APPLICATION_ID,
        secret_key: process.env.JUNO_SECRET_KEY
      })
    });

    const tokenData = await tokenResponse.json();
    console.log('↪ Token exchange response:', tokenData);

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData);
      return res.redirect('https://a2842d04cca8.ngrok-free.app/?error=token_exchange_failed');
    }

    const { access_token, refresh_token } = tokenData;

    // Get user info from JunoPay
    const userInfoResponse = await fetch(`${process.env.JUNOPAY_API_BASE_URL}/get-client-user-info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify({})
    });

    const userInfo = await userInfoResponse.json();
    console.log('↪ User info from JunoPay:', userInfo);

    if (!userInfoResponse.ok) {
      console.error('Failed to get user info:', userInfo);
      return res.redirect('https://a2842d04cca8.ngrok-free.app/?error=user_info_failed');
    }

    const { clientId, email, name, buyerFee } = userInfo;

    // Find or create user - first try by junopay_client_id, then by email
    let user = await User.findOne({ junopay_client_id: clientId });
    
    if (!user) {
      // Try to find existing user by email
      user = await User.findOne({ email: email });
      
      if (user) {
        // Update existing user with JunoPay info
        console.log('↪ Updating existing user with JunoPay clientId:', clientId);
        user.junopay_client_id = clientId;
        user.access_token = access_token;
        user.refresh_token = refresh_token;
        user.name = name || user.name;
        user.buyer_fee = buyerFee;
        await user.save();
      } else {
        // Create new user
        console.log('↪ Creating new user for clientId:', clientId);
        user = new User({
          junopay_client_id: clientId,
          email: email || `${clientId}@junopay.com`,
          name: name || 'JunoPay User',
          company_name: 'JunoPay User',
          is_admin: false,
          access_token,
          refresh_token,
          buyer_fee: buyerFee
        });
        await user.save();
      }
    } else {
      // Update tokens for existing user
      console.log('↪ Updating tokens for existing JunoPay user:', clientId);
      user.access_token = access_token;
      user.refresh_token = refresh_token;
      user.buyer_fee = buyerFee;
      await user.save();
    }

    // Store user in session
    req.session.user = {
      _id: user._id,
      junopay_client_id: user.junopay_client_id,
      email: user.email,
      name: user.name,
      company_name: user.company_name,
      is_admin: user.is_admin,
      buyer_fee: user.buyer_fee
    };

    console.log('✅ JunoPay authentication successful for user:', user.name);
    console.log('↪ Session after setting user:', JSON.stringify(req.session, null, 2));
    console.log('↪ Final user object stored in session:', JSON.stringify(req.session.user, null, 2));
    
    // Redirect to logged-in page
    console.log('↪ Redirecting to: https://a2842d04cca8.ngrok-free.app/loggedin');
    res.redirect('https://a2842d04cca8.ngrok-free.app/loggedin');

  } catch (error) {
    console.error('JunoPay callback error:', error);
    res.redirect('https://a2842d04cca8.ngrok-free.app/?error=callback_error');
  }
});

// Get user's access token for client-side logout
router.get('/logout-token', async (req, res) => {
  console.log('📤 Getting logout token for client...');

  if (req.session?.user?._id) {
    try {
      // Get the user's access token from the database
      const user = await User.findById(req.session.user._id).select('+access_token');

      if (user?.access_token) {
        console.log('↪ Returning access token for client-side logout');
        return res.json({
          success: true,
          access_token: user.access_token
        });
      } else {
        console.log('⚠️ No access token found for user');
        return res.json({
          success: false,
          message: 'No token available'
        });
      }
    } catch (error) {
      console.error('❌ Error getting logout token:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get logout token'
      });
    }
  } else {
    return res.json({
      success: false,
      message: 'No active session'
    });
  }
});

// Proxy for JunoPay application_logout (to bypass CORS)
router.post('/application-logout-proxy', async (req, res) => {
  console.log('🔄 Proxying application_logout request to JunoPay...');

  if (req.session?.user?._id) {
    try {
      // Get the user's access token from the database
      const user = await User.findById(req.session.user._id).select('+access_token');

      if (user?.access_token) {
        console.log('↪ Making application_logout request to JunoPay...');

        // Call JunoPay application_logout
        const logoutResponse = await fetch('https://stg.junomoney.org/restapi/application_logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.access_token}`
          },
          body: JSON.stringify({
            token: user.access_token,
            client_id: process.env.JUNO_APPLICATION_ID || 'PaulsMarketplace-cafd2e7e'
          })
        });

        const responseText = await logoutResponse.text();
        console.log('↪ JunoPay application_logout response:', logoutResponse.status, responseText);

        return res.json({
          success: true,
          status: logoutResponse.status,
          message: 'Application logout called'
        });
      } else {
        console.log('⚠️ No access token found for user');
        return res.json({
          success: false,
          message: 'No token available'
        });
      }
    } catch (error) {
      console.error('❌ Error calling application_logout:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to call application_logout'
      });
    }
  } else {
    return res.json({
      success: false,
      message: 'No active session'
    });
  }
});

// Logout route
router.post('/logout', async (req, res) => {
  console.log('🚪 Logout request received');
  console.log('↪ Session before logout:', JSON.stringify(req.session, null, 2));
  
  // Clear tokens from our database only (JunoPay logout will be called from browser)
  if (req.session?.user?._id) {
    try {
      // Get the user's access token from the database
      const user = await User.findById(req.session.user._id).select('+access_token +refresh_token');
      console.log('↪ User found:', user ? 'Yes' : 'No');

      if (user) {
        // Clear the tokens from our database
        user.access_token = null;
        user.refresh_token = null;
        await user.save();
        console.log('↪ Tokens cleared from database');
        console.log('↪ JunoPay logout will be called from browser with authentication');
      } else {
        console.log('⚠️ User not found in database');
      }
    } catch (error) {
      console.error('❌ Error clearing user tokens:', error);
      // Continue with local logout even if token clearing fails
    }
  } else {
    console.log('⚠️ No user session found');
  }
  
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).json({ success: false, error: 'Failed to logout' });
    }
    
    // Clear the session cookie
    res.clearCookie('connect.sid', { path: '/' });
    
    // Set headers to prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    console.log('✅ Session destroyed successfully');
    res.json({ 
      success: true, 
      message: 'Logged out successfully',
      clearStorage: true // Signal to frontend to clear localStorage/sessionStorage
    });
  });
});

export default router;