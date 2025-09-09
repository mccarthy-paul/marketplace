import express from 'express';
import Transaction from '../db/transactionModel.js';
import Bid from '../db/bidModel.js';
import Watch from '../db/watchModel.js';
import User from '../db/userModel.js';
import junopayService from '../services/junopayService.js';

const router = express.Router();

// Admin login endpoint (for admin@luxe24.com)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Simple check for admin email (in production, add proper password verification)
    if (email === 'admin@luxe24.com') {
      const admin = await User.findOne({ email: 'admin@luxe24.com' });
      
      if (admin) {
        req.session.user = admin.toObject();
        res.json({ success: true, user: admin });
      } else {
        res.status(401).json({ error: 'Admin user not found' });
      }
    } else {
      res.status(401).json({ error: 'Invalid admin credentials' });
    }
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Middleware to check admin access
const requireAdmin = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (!req.session.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  req.user = req.session.user;
  next();
};

// Stats endpoints for dashboard
router.get('/orders/count', requireAdmin, async (req, res) => {
  try {
    const count = await Transaction.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error getting orders count:', error);
    res.status(500).json({ error: 'Failed to get orders count' });
  }
});

router.get('/bids/count', requireAdmin, async (req, res) => {
  try {
    const count = await Bid.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error getting bids count:', error);
    res.status(500).json({ error: 'Failed to get bids count' });
  }
});

router.get('/watches/count', requireAdmin, async (req, res) => {
  try {
    const count = await Watch.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error getting watches count:', error);
    res.status(500).json({ error: 'Failed to get watches count' });
  }
});

router.get('/users/count', requireAdmin, async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error getting users count:', error);
    res.status(500).json({ error: 'Failed to get users count' });
  }
});

// Orders management
router.get('/orders', requireAdmin, async (req, res) => {
  try {
    const orders = await Transaction.find({})
      .populate('buyer', 'name email company_name')
      .populate('seller', 'name email company_name')
      .populate('watch', 'brand model reference_number imageUrl price condition year')
      .sort({ created_at: -1 });

    // Add current status from stored data for now
    // In future, we could batch call JunoPay API for real-time status
    const ordersWithStatus = orders.map(order => ({
      ...order.toObject(),
      currentStatus: order.status
    }));

    res.json({ 
      success: true, 
      orders: ordersWithStatus 
    });
  } catch (error) {
    console.error('Error fetching admin orders:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve orders' 
    });
  }
});

router.get('/orders/:orderId', requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Transaction.findById(orderId)
      .populate('buyer', 'name email company_name')
      .populate('seller', 'name email company_name') 
      .populate('watch', 'brand model reference_number imageUrl price condition year description');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }

    // Add current status
    const orderWithStatus = {
      ...order.toObject(),
      currentStatus: order.status
    };

    res.json({ 
      success: true, 
      order: orderWithStatus 
    });
  } catch (error) {
    console.error('Error fetching admin order details:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve order details' 
    });
  }
});

// Refresh order status from JunoPay
router.post('/orders/:orderId/refresh-status', requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Transaction.findById(orderId)
      .populate('buyer', 'name email company_name access_token refresh_token junopay_client_id')
      .populate('seller', 'name email company_name')
      .populate('watch', 'brand model reference_number imageUrl price condition year');

    if (!order) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }

    try {
      // Get fresh status from JunoPay
      const junoPayDetails = await junopayService.getTransactionDetails(
        order.buyer,
        order.applicationTransactionId
      );

      // Update stored status if different
      if (junoPayDetails.status && junoPayDetails.status !== order.status) {
        order.status = junoPayDetails.status;
        order.updated_at = new Date();
        await order.save();
      }

      const orderWithStatus = {
        ...order.toObject(),
        currentStatus: junoPayDetails.status || order.status,
        junoPayDetails: junoPayDetails
      };

      res.json({ 
        success: true, 
        order: orderWithStatus 
      });
    } catch (junoError) {
      console.error('JunoPay API error:', junoError);
      // Return order with stored status if JunoPay fails
      const orderWithStatus = {
        ...order.toObject(),
        currentStatus: order.status
      };

      res.json({ 
        success: true, 
        order: orderWithStatus,
        warning: 'Could not refresh status from JunoPay'
      });
    }
  } catch (error) {
    console.error('Error refreshing order status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to refresh order status' 
    });
  }
});

// Bids management
router.get('/bids', requireAdmin, async (req, res) => {
  try {
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
    console.error('Error fetching admin bids:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve bids' 
    });
  }
});

router.get('/bids/:bidId', requireAdmin, async (req, res) => {
  try {
    const { bidId } = req.params;
    
    const bid = await Bid.findById(bidId)
      .populate('bidder', 'name email company_name is_admin')
      .populate({
        path: 'watch',
        select: 'brand model reference_number imageUrl price condition year description owner',
        populate: {
          path: 'owner',
          select: 'name email company_name'
        }
      });

    if (!bid) {
      return res.status(404).json({ 
        success: false, 
        error: 'Bid not found' 
      });
    }

    res.json({ 
      success: true, 
      bid: bid 
    });
  } catch (error) {
    console.error('Error fetching admin bid details:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve bid details' 
    });
  }
});

export default router;