import express from 'express';
import User from '../db/userModel.js'; // Assuming userModel.js exists and exports a User model
// TODO: Import bcrypt for password comparison

const router = express.Router();

// Admin login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // TODO: Implement user authentication and admin check
    // 1. Find user by email
    // 2. Compare password (use bcrypt.compare)
    // 3. Check if user.is_admin is true
    // 4. If successful, establish session (req.session.user = user) and send success response
    // 5. If not successful, send 401 Unauthorized or 403 Forbidden

    // Placeholder for authentication logic
    const user = await User.findOne({ email }).select('+password'); // Explicitly select the password field

    console.log('User found:', user); // Log the user object
    console.log('Stored password:', user ? user.password : 'User not found'); // Log the stored password

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // TODO: Replace with bcrypt.compare
    if (password !== user.password) { // WARNING: This is not secure, replace with bcrypt.compare
       return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_admin) {
      return res.status(403).json({ message: 'Forbidden: Not an admin' });
    }

    // Authentication and authorization successful
    req.session.user = user; // Establish session
    console.log('Session after login:', req.session); // Log the session object
    res.status(200).json({ message: 'Admin login successful', user: { _id: user._id, email: user.email, is_admin: user.is_admin } }); // Send limited user info

  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Middleware to check if user is authenticated (assuming it's defined and accessible)
// TODO: Ensure isAuthenticated middleware is correctly imported or accessible
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
    res.status(200).json({ isAuthenticatedAdmin: true, user: { _id: req.session.user._id, email: req.session.user.email } });
  } else {
    res.status(403).json({ isAuthenticatedAdmin: false, message: 'Forbidden: Not an admin' });
  }
});


export default router;
