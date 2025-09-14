import express from 'express';
import User from '../db/userModel.js';

const router = express.Router();

// Middleware to check if user is authenticated (assuming it's defined in api/index.js)
function isAuthenticated(req, res, next) {
  console.log('isAuthenticated middleware in users.js:');
  console.log('req.session:', req.session);
  console.log('req.session.user:', req.session?.user);
  if (req.session && req.session.user) {
    next();
  } else {
    console.log('Authentication failed in users.js: req.session or req.session.user is missing.');
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Middleware to check if user is an admin
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.is_admin) {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden' });
  }
}

// Get all users (Admin only)
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get the currently authenticated user
router.get('/me', isAuthenticated, async (req, res) => {
  try {
    // Fetch fresh user data from database to get latest delivery address
    const user = await User.findById(req.session.user._id);
    if (user) {
      res.json({ user });
    } else {
      // This case should ideally not be reached if isAuthenticated works correctly
      res.status(404).json({ message: 'User not found in session' });
    }
  } catch (err) {
    console.error('Error fetching current user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update current user's delivery address
router.put('/me/delivery-address', isAuthenticated, async (req, res) => {
  try {
    const { street, city, state, postalCode, country } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.session.user._id,
      {
        defaultDeliveryAddress: {
          street,
          city,
          state,
          postalCode,
          country: country || 'USA'
        }
      },
      { new: true }
    );
    
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error('Error updating delivery address:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific user (Admin only)
router.get('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new user (Admin only)
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { juno_id, email, name, company_name, is_admin, password } = req.body; // Include password for admin creation
    // TODO: Hash the password with bcrypt before saving

    const newUser = new User({
      juno_id,
      email,
      name,
      company_name,
      is_admin,
      password, // WARNING: Store hashed password in production
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (err) {
    console.error('Error creating user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a user (Admin only)
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    // Prevent updating juno_id and potentially other sensitive fields if needed
    delete updateData.juno_id;
    // TODO: Handle password updates securely (e.g., hash new password)

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true });

    if (updatedUser) {
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error('Error updating user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a user (Admin only)
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const userId = req.params.id;
    const deletedUser = await User.findByIdAndDelete(userId);
    if (deletedUser) {
      res.sendStatus(204); // No content on successful deletion
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;
