import express from 'express';
import Order from '../db/orderModel.js';

const router = express.Router();

// Middleware to check if user is authenticated (assuming it's defined in api/index.js)
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Get all orders for the current user
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id; // Use MongoDB _id
    const orders = await Order.find({ buyer_id: userId }).populate('listing_id');
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific order
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.session.user._id; // Use MongoDB _id
    const order = await Order.findOne({ _id: orderId, buyer_id: userId }).populate('listing_id');
    if (order) {
      res.json(order);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new order
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { listing_id } = req.body;
    const buyer_id = req.session.user._id; // Use MongoDB _id
    const newOrder = new Order({ listing_id, buyer_id, status: 'Pending' });
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update an order (e.g., change status)
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status } = req.body;
    const userId = req.session.user._id; // Use MongoDB _id
    const updatedOrder = await Order.findOneAndUpdate({ _id: orderId, buyer_id: userId }, { status, updated_at: new Date() }, { new: true });
    if (updatedOrder) {
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: 'Order not found' });
    }
  } catch (err) {
    console.error('Error updating order:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
