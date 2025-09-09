import express from 'express';
import User from '../../api/db/userModel.js';

const router = express.Router();

// Admin login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');

    console.log('Admin login attempt for:', email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // TODO: Replace with bcrypt.compare in production
    if (password !== user.password) {
       return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_admin) {
      return res.status(403).json({ message: 'Forbidden: Not an admin' });
    }

    // Authentication and authorization successful
    req.session.user = {
      _id: user._id,
      email: user.email,
      name: user.name,
      is_admin: user.is_admin
    };
    
    console.log('Admin login successful for:', user.email);
    res.status(200).json({ 
      message: 'Admin login successful', 
      user: { 
        _id: user._id, 
        email: user.email, 
        name: user.name,
        is_admin: user.is_admin 
      } 
    });

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Admin status check route
router.get('/status', isAuthenticated, (req, res) => {
  if (req.session.user.is_admin) {
    res.status(200).json({ 
      isAuthenticatedAdmin: true, 
      user: { 
        _id: req.session.user._id, 
        email: req.session.user.email,
        name: req.session.user.name,
        is_admin: req.session.user.is_admin
      } 
    });
  } else {
    res.status(403).json({ 
      isAuthenticatedAdmin: false, 
      message: 'Forbidden: Not an admin' 
    });
  }
});

// Admin logout route
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).json({ success: false, error: 'Failed to logout' });
    }
    res.json({ success: true, message: 'Logged out successfully' });
  });
});

export default router;