import express from 'express';
import Bid from '../db/bidModel.js';
import Watch from '../db/watchModel.js';
// Assuming authentication middleware

const router = express.Router();

// Middleware to check if user is authenticated (copied from watches.js)
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}


// @desc    Place a bid on a watch
// @route   POST /api/bids/:watchId
// @access  Private
router.post('/:watchId', isAuthenticated, async (req, res) => {
  const { amount } = req.body;
  const { watchId } = req.params;
  const bidderId = req.user._id; // Assuming user ID is available from protect middleware

  try {
    const watch = await Watch.findById(watchId);

    if (!watch) {
      return res.status(404).json({ message: 'Watch not found' });
    }

    // Check if the bid is higher than the current bid
    if (amount <= watch.currentBid) {
      return res.status(400).json({ message: 'Bid amount must be higher than the current bid' });
    }

    // Create a new bid
    const bid = new Bid({
      watch: watchId,
      bidder: bidderId,
      amount,
    });

    await bid.save();

    // Update the watch's current bid and buyer
    watch.currentBid = amount;
    watch.buyer = bidderId; // Temporarily set buyer to the highest bidder
    await watch.save();

    res.status(201).json({ message: 'Bid placed successfully', bid });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get bids for a watch
// @route   GET /api/bids/:watchId
// @access  Public
router.get('/:watchId', async (req, res) => {
  const { watchId } = req.params;

  try {
    const bids = await Bid.find({ watch: watchId }).populate('bidder', 'username'); // Populate bidder with username

    res.json(bids);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;
