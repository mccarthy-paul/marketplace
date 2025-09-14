import express from 'express';
import Cart from '../db/cartModel.js';
import Watch from '../db/watchModel.js';
import Bid from '../db/bidModel.js';

const router = express.Router();

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Get user's cart
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    
    let cart = await Cart.findOne({ user: userId })
      .populate({
        path: 'items.watch',
        populate: { path: 'owner', select: 'name company_name junopay_client_id email' }
      })
      .populate('items.fromBid');
    
    // Create cart if it doesn't exist
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }
    
    res.json(cart);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add item to cart (from Buy Now button)
router.post('/add', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { watchId, price } = req.body;
    
    // Verify watch exists and is available
    const watch = await Watch.findById(watchId);
    if (!watch) {
      return res.status(404).json({ message: 'Watch not found' });
    }
    
    if (watch.status === 'sold') {
      return res.status(400).json({ message: 'This watch has already been sold' });
    }
    
    if (watch.status === 'pending') {
      return res.status(400).json({ message: 'This watch has a pending sale. Please try again later.' });
    }
    
    if (watch.status !== 'active') {
      return res.status(400).json({ message: 'This watch is not available for purchase' });
    }
    
    // Get or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }
    
    // Check if item already in cart
    const existingItem = cart.items.find(item => 
      item.watch.toString() === watchId
    );
    
    if (existingItem) {
      return res.status(400).json({ message: 'Watch already in cart' });
    }
    
    // Add item to cart
    cart.items.push({
      watch: watchId,
      price: price || watch.price,
      quantity: 1
    });
    
    await cart.save();
    
    // Populate the cart before sending response
    await cart.populate({
      path: 'items.watch',
      populate: { path: 'owner', select: 'name company_name junopay_client_id email' }
    });
    
    res.json({ message: 'Item added to cart', cart });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add item to cart from accepted bid
router.post('/add-from-bid', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { bidId } = req.body;
    
    // Verify bid exists and is accepted
    const bid = await Bid.findById(bidId).populate('watch');
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }
    
    if (bid.status !== 'accepted') {
      return res.status(400).json({ message: 'Bid must be accepted to add to cart' });
    }
    
    // Verify user is the bidder
    if (bid.bidder.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Get or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }
    
    // Check if item already in cart
    const existingItem = cart.items.find(item => 
      item.watch.toString() === bid.watch._id.toString()
    );
    
    if (existingItem) {
      return res.status(400).json({ message: 'Watch already in cart' });
    }
    
    // Add item to cart with agreed price from bid
    cart.items.push({
      watch: bid.watch._id,
      price: bid.agreedPrice || bid.amount,
      quantity: 1,
      fromBid: bidId
    });
    
    await cart.save();
    
    // Populate the cart before sending response
    await cart.populate({
      path: 'items.watch',
      populate: { path: 'owner', select: 'name company_name junopay_client_id email' }
    });
    
    res.json({ message: 'Item added to cart from accepted bid', cart });
  } catch (error) {
    console.error('Error adding bid to cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove item from cart
router.delete('/remove/:itemId', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { itemId } = req.params;
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    // Remove item
    cart.items = cart.items.filter(item => 
      item._id.toString() !== itemId
    );
    
    await cart.save();
    
    // Populate the cart before sending response
    await cart.populate({
      path: 'items.watch',
      populate: { path: 'owner', select: 'name company_name junopay_client_id email' }
    });
    
    res.json({ message: 'Item removed from cart', cart });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update cart delivery details
router.put('/delivery', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { deliveryAddress, deliveryMethod } = req.body;
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    // Update delivery details
    if (deliveryAddress) {
      cart.deliveryAddress = deliveryAddress;
    }
    
    if (deliveryMethod) {
      cart.deliveryMethod = deliveryMethod;
      // Calculate shipping cost based on method
      if (deliveryMethod === 'shipping') {
        // Flat rate shipping for now, can be made more sophisticated
        cart.shippingCost = 50;
      } else {
        cart.shippingCost = 0;
      }
    }
    
    await cart.save();
    
    // Populate the cart before sending response
    await cart.populate({
      path: 'items.watch',
      populate: { path: 'owner', select: 'name company_name junopay_client_id email' }
    });
    
    res.json({ message: 'Delivery details updated', cart });
  } catch (error) {
    console.error('Error updating delivery:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Clear cart
router.delete('/clear', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.user._id;
    
    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }
    
    cart.items = [];
    cart.deliveryAddress = null;
    cart.deliveryMethod = null;
    cart.shippingCost = 0;
    
    await cart.save();
    
    res.json({ message: 'Cart cleared', cart });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;