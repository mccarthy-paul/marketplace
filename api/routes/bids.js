import express from 'express';
import Bid from '../db/bidModel.js';
import Watch from '../db/watchModel.js';
import User from '../db/userModel.js'; // Import User model
// Assuming authentication middleware

const router = express.Router();

// Middleware to check if user is authenticated (copied from watches.js)
function isAuthenticated(req, res, next) {
  console.log('isAuthenticated middleware in bids.js:');
  console.log('req.session:', req.session);
  console.log('req.session.user:', req.session?.user);
  if (req.session && req.session.user) {
    next();
  } else {
    console.log('Authentication failed: req.session or req.session.user is missing.');
    res.status(401).json({ message: 'Unauthorized' });
  }
}


// @desc    Place a bid on a watch
// @route   POST /api/bids/:watchId
// @access  Private
router.post('/:watchId', isAuthenticated, async (req, res) => {
  const { amount, comment } = req.body;
  const { watchId } = req.params;
  const bidderId = req.session.user._id; // Get user ID from session

  try {
    // Fetch the bidder's user document to get email and name
    const bidderUser = await User.findById(bidderId);
    if (!bidderUser) {
      return res.status(404).json({ message: 'Bidder user not found' });
    }

    const watch = await Watch.findById(watchId).populate('owner', 'email'); // Populate owner to get email

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
      ownerEmail: watch.owner ? watch.owner.email : null, // Populate owner email
      bidderEmail: bidderUser.email, // Populate bidder email
      bidderName: bidderUser.name, // Populate bidder name
      status: 'offered', // Set initial status
      comments: comment ? [{ text: comment, user: bidderId, created_at: new Date() }] : [], // Add initial comment if provided
    });

    try {
      await bid.save();
      console.log('Bid saved successfully:', bid);
    } catch (saveError) {
      console.error('Error saving bid:', saveError);
      return res.status(500).json({ message: 'Error saving bid' });
    }


    // Update the watch's current bid and buyer
    watch.currentBid = amount;
    watch.buyer = bidderId; // Temporarily set buyer to the highest bidder
    try {
      await watch.save();
      console.log('Watch updated successfully:', watch);
    } catch (saveError) {
      console.error('Error saving watch:', saveError);
      return res.status(500).json({ message: 'Error saving watch' });
    }


    res.status(201).json({ message: 'Bid placed successfully', bid });
  } catch (error) {
    console.error('Error in bid placement process:', error);
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


// @desc    Get a single bid by ID
// @route   GET /api/bids/:bidId
// @access  Public (or Private, depending on requirements - making it Public for now)
router.get('/:bidId', async (req, res) => {
  const { bidId } = req.params;

  try {
    const bid = await Bid.findById(bidId)
      .populate('watch', 'model price') // Populate watch details
      .populate('bidder', 'email name'); // Populate bidder details
      // TODO: Populate comments once added to model

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    res.json(bid);
  } catch (error) {
    console.error('Error fetching bid details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// @desc    Add a comment to a bid
// @route   POST /api/bids/:bidId/comments
// @access  Private
router.post('/:bidId/comments', isAuthenticated, async (req, res) => {
  const { comment } = req.body;
  const { bidId } = req.params;
  const userId = req.session.user._id; // Logged-in user ID

  try {
    const bid = await Bid.findById(bidId);

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Add the comment to the bid's comments array
    bid.comments.push({
      text: comment,
      user: userId, // Store the user who made the comment
      created_at: new Date()
    });

    await bid.save();

    res.status(201).json({ message: 'Comment added successfully', bid });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// @desc    Get bids for watches owned by the logged-in user
// @route   GET /api/bids/user/watches
// @access  Private
router.get('/user/watches', isAuthenticated, async (req, res) => {
  const userId = req.session.user._id; // Assuming user ID is available from session
  const userEmail = req.session.user.email; // Get user email from session
  console.log('Fetching bids for user:', userId, 'with email:', userEmail);

  try {
    // Find bids where the user is the bidder or the owner of the watch
    const query = {
      $or: [
        { bidder: userId },
        { ownerEmail: userEmail } // Assuming ownerEmail is stored in bid and matches user's email
      ]
    };
    console.log('Mongoose query:', JSON.stringify(query));

    const bids = await Bid.find(query)
      .populate('watch', 'model price') // Populate watch with model and price
      .populate('bidder', 'email') // Populate bidder with email
      .populate('comments.user', 'email name'); // Populate the user who made the comment

    console.log('Fetched bids:', bids);

    res.json(bids);
  } catch (error) {
    console.error('Error fetching user watches bids:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// @desc    Update bid status
// @route   PUT /api/bids/:bidId/status
// @access  Private
router.put('/:bidId/status', isAuthenticated, async (req, res) => {
  const { status } = req.body;
  const { bidId } = req.params;
  const userId = req.session.user._id; // Logged-in user ID
  const userEmail = req.session.user.email; // Logged-in user email

  try {
    const bid = await Bid.findById(bidId).populate('watch', 'owner'); // Populate watch to check owner

    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Authorization check
    const isOwner = bid.ownerEmail === userEmail;
    const isBidder = bid.bidder.equals(userId);

    if (!isOwner && !isBidder) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Validate status change based on user type and current status
    if (isOwner) {
      // Owner can accept or reject offered bids
      if (bid.status === 'offered' && (status === 'accepted' || status === 'rejected')) {
        bid.status = status;
      } else {
        return res.status(400).json({ message: `Invalid status change for owner from ${bid.status}` });
      }
    } else if (isBidder) {
      // Bidder can cancel offered bids
      if (bid.status === 'offered' && status === 'cancelled') {
        bid.status = status;
      } else {
        return res.status(400).json({ message: `Invalid status change for bidder from ${bid.status}` });
      }
    }

    await bid.save();

    res.json({ message: 'Bid status updated successfully', bid });
  } catch (error) {
    console.error('Error updating bid status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// @desc    Get all bids placed by the current user
// @route   GET /api/bids/user/placed
// @access  Private
router.get('/user/placed', isAuthenticated, async (req, res) => {
  const userId = req.session.user._id;

  try {
    const bids = await Bid.find({ bidder: userId })
      .populate('watch', 'brand model reference_number imageUrl price status')
      .populate('bidder', 'name email')
      .sort({ created_at: -1 }); // Sort by newest first

    console.log(`Found ${bids.length} bids placed by user ${userId}`);
    res.json(bids);
  } catch (error) {
    console.error('Error fetching user placed bids:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all bids received on the current user's watches
// @route   GET /api/bids/user/received
// @access  Private
router.get('/user/received', isAuthenticated, async (req, res) => {
  const userId = req.session.user._id;
  const userEmail = req.session.user.email;

  try {
    // Find bids on watches owned by the user (using ownerEmail)
    const bids = await Bid.find({ ownerEmail: userEmail })
      .populate('watch', 'brand model reference_number imageUrl price status')
      .populate('bidder', 'name email')
      .sort({ created_at: -1 }); // Sort by newest first

    console.log(`Found ${bids.length} bids received by user ${userId} (${userEmail})`);
    res.json(bids);
  } catch (error) {
    console.error('Error fetching user received bids:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
