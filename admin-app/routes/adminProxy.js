import express from 'express';
import axios from 'axios';

const router = express.Router();

// Middleware to check if user is authenticated admin
function requireAdminAuth(req, res, next) {
  if (req.session && req.session.user && req.session.user.is_admin) {
    next();
  } else {
    res.status(401).json({ error: 'Admin authentication required' });
  }
}

// Proxy orders endpoints
router.get('/orders/count', requireAdminAuth, async (req, res) => {
  try {
    // Make request to main API using admin session (simulate admin login)
    const response = await axios.get('http://localhost:8001/api/admin/orders/count', {
      withCredentials: true,
      headers: {
        'Cookie': `connect.sid=${req.sessionID}` // Forward session if needed
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(error.response?.status || 500).json({ 
      error: error.response?.data?.error || 'Failed to fetch orders count' 
    });
  }
});

router.get('/orders', requireAdminAuth, async (req, res) => {
  try {
    // For now, we'll directly query the database since cross-service auth is complex
    const Transaction = (await import('../../api/db/transactionModel.js')).default;
    
    const orders = await Transaction.find({})
      .populate('buyer', 'name email company_name')
      .populate('seller', 'name email company_name')
      .populate('watch', 'brand model reference_number imageUrl price condition year')
      .sort({ created_at: -1 });

    // Add current status from stored data
    const ordersWithStatus = orders.map(order => ({
      ...order.toObject(),
      currentStatus: order.status
    }));

    res.json({ 
      success: true, 
      orders: ordersWithStatus 
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve orders' 
    });
  }
});

// Proxy bids endpoints
router.get('/bids/count', requireAdminAuth, async (req, res) => {
  try {
    const Bid = (await import('../../api/db/bidModel.js')).default;
    const count = await Bid.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error getting bids count:', error);
    res.status(500).json({ error: 'Failed to get bids count' });
  }
});

router.get('/bids', requireAdminAuth, async (req, res) => {
  try {
    const Bid = (await import('../../api/db/bidModel.js')).default;
    
    const bids = await Bid.find({})
      .populate('bidder', 'name email company_name')
      .populate('watch', 'brand model reference_number imageUrl price condition year')
      .populate({
        path: 'watch',
        populate: {
          path: 'owner',
          select: 'name email company_name'
        }
      })
      .sort({ created_at: -1 });

    res.json({ 
      success: true, 
      bids: bids 
    });
  } catch (error) {
    console.error('Error fetching bids:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve bids' 
    });
  }
});

// Add other proxy endpoints as needed (users, watches)
router.get('/users/count', requireAdminAuth, async (req, res) => {
  try {
    const User = (await import('../../api/db/userModel.js')).default;
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error getting users count:', error);
    res.status(500).json({ error: 'Failed to get users count' });
  }
});

router.get('/watches/count', requireAdminAuth, async (req, res) => {
  try {
    const Watch = (await import('../../api/db/watchModel.js')).default;
    const count = await Watch.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error getting watches count:', error);
    res.status(500).json({ error: 'Failed to get watches count' });
  }
});

export default router;