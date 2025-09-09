import express from 'express';
import User from '../../api/db/userModel.js';

const router = express.Router();

// Middleware to check admin authentication
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.is_admin) {
    next();
  } else {
    res.status(401).json({ message: 'Admin access required' });
  }
}

// Get all users (admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password') // Exclude password field
      .sort({ created_at: -1 });
    
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single user (admin)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user (admin)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Remove password from update data if it's empty
    if (updateData.password === '') {
      delete updateData.password;
    }
    
    const user = await User.findByIdAndUpdate(id, updateData, { new: true })
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User updated by admin:', user._id);
    res.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User deleted by admin:', user._id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;