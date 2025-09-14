import express from 'express';
import Bid from '../db/bidModel.js';
import Watch from '../db/watchModel.js';
import User from '../db/userModel.js'; // Import User model
import Notification from '../db/notificationModel.js'; // Import Notification model
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

    // New bidding logic: bid should be LOWER than the listed price (if there is one)
    if (watch.price && amount >= watch.price) {
      return res.status(400).json({ 
        message: `Bid amount must be lower than the listed price of $${watch.price}. Use 'Buy Now' to purchase at the listed price.` 
      });
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
      negotiationHistory: [{
        amount: amount,
        proposedBy: bidderId,
        proposedByRole: 'buyer',
        message: comment || 'Initial offer',
        created_at: new Date()
      }]
    });

    try {
      await bid.save();
      console.log('Bid saved successfully:', bid);
      
      // Create notification for watch owner about new bid
      if (watch.owner && watch.owner._id.toString() !== bidderId) {
        await Notification.createNotification({
          user: watch.owner._id,
          type: 'new_bid',
          title: 'New Bid Received',
          message: `${bidderUser.name} placed a bid of ${amount} on your ${watch.brand} ${watch.model}`,
          relatedEntity: {
            entityType: 'bid',
            entityId: bid._id
          }
        });
      }
    } catch (saveError) {
      console.error('Error saving bid:', saveError);
      return res.status(500).json({ message: 'Error saving bid' });
    }


    // Don't automatically update the watch's currentBid anymore since we have negotiation
    // The currentBid will only be updated when a bid is accepted


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
      .populate('watch', 'brand model reference_number imageUrl price status currency owner')
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
      .populate('watch', 'brand model reference_number imageUrl price status currency owner')
      .populate('bidder', 'name email')
      .sort({ created_at: -1 }); // Sort by newest first

    console.log(`Found ${bids.length} bids received by user ${userId} (${userEmail})`);
    res.json(bids);
  } catch (error) {
    console.error('Error fetching user received bids:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Accept a bid or counter offer
// @route   POST /api/bids/:bidId/accept
// @access  Private (Seller can accept buyer's offer, Buyer can accept seller's counter offer)
router.post('/:bidId/accept', isAuthenticated, async (req, res) => {
  const { bidId } = req.params;
  const userId = req.session.user._id;

  try {
    const bid = await Bid.findById(bidId).populate('watch');
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Get the watch details
    const watch = await Watch.findById(bid.watch._id);
    const isSeller = watch.owner.toString() === userId;
    const isBuyer = bid.bidder.toString() === userId;

    // Determine who can accept based on the bid status
    let canAccept = false;
    let acceptorRole = '';
    
    if (bid.status === 'offered' && isSeller) {
      // Seller can accept buyer's initial offer
      canAccept = true;
      acceptorRole = 'seller';
    } else if (bid.status === 'counter_offer' && isBuyer) {
      // Buyer can accept seller's counter offer
      canAccept = true;
      acceptorRole = 'buyer';
    } else if (bid.status === 'negotiating') {
      // Either party can accept during negotiation
      if (isSeller || isBuyer) {
        canAccept = true;
        acceptorRole = isSeller ? 'seller' : 'buyer';
      }
    }

    if (!canAccept) {
      return res.status(403).json({ 
        message: 'Unauthorized - you cannot accept this bid in its current state',
        details: {
          bidStatus: bid.status,
          isSeller,
          isBuyer
        }
      });
    }

    // Update bid status to accepted and set agreed price
    bid.status = 'accepted';
    bid.agreedPrice = bid.amount;
    bid.updated_at = new Date();
    
    // Add to negotiation history
    if (!bid.negotiationHistory) {
      bid.negotiationHistory = [];
    }
    bid.negotiationHistory.push({
      amount: bid.amount,
      proposedBy: userId,
      proposedByRole: acceptorRole,
      message: `Offer accepted by ${acceptorRole}`,
      created_at: new Date()
    });
    
    await bid.save();
    
    // Create notification for the other party about bid acceptance
    const notificationUserId = isSeller ? bid.bidder : bid.watch.owner;
    const watchDetails = await Watch.findById(bid.watch._id || bid.watch);
    const notificationUser = await User.findById(notificationUserId);
    
    if (notificationUserId && notificationUserId.toString() !== userId) {
      await Notification.createNotification({
        user: notificationUserId,
        type: 'bid_accepted',
        title: 'Bid Accepted!',
        message: isSeller 
          ? `Your bid on ${watchDetails.brand} ${watchDetails.model} has been accepted at ${bid.agreedPrice}`
          : `${notificationUser.name} accepted your counter offer of ${bid.agreedPrice} for ${watchDetails.brand} ${watchDetails.model}`,
        relatedEntity: {
          entityType: 'bid',
          entityId: bid._id
        }
      });
    }

    res.json({ message: 'Offer accepted successfully', bid });
  } catch (error) {
    console.error('Error accepting bid:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Reject a bid
// @route   POST /api/bids/:bidId/reject  
// @access  Private (Seller only)
router.post('/:bidId/reject', isAuthenticated, async (req, res) => {
  const { bidId } = req.params;
  const userId = req.session.user._id;

  try {
    const bid = await Bid.findById(bidId).populate('watch');
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Check if the user is the owner of the watch
    const watch = await Watch.findById(bid.watch._id);
    if (watch.owner.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized - only the watch owner can reject bids' });
    }

    // Update bid status to rejected
    bid.status = 'rejected';
    bid.updated_at = new Date();
    
    await bid.save();

    res.json({ message: 'Bid rejected', bid });
  } catch (error) {
    console.error('Error rejecting bid:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Send counter offer
// @route   POST /api/bids/:bidId/counter
// @access  Private 
router.post('/:bidId/counter', isAuthenticated, async (req, res) => {
  const { bidId } = req.params;
  const { amount, message } = req.body;
  const userId = req.session.user._id;

  try {
    const bid = await Bid.findById(bidId).populate('watch');
    
    if (!bid) {
      return res.status(404).json({ message: 'Bid not found' });
    }

    // Determine if the user is buyer or seller
    const watch = await Watch.findById(bid.watch._id);
    const isSeller = watch.owner.toString() === userId;
    const isBuyer = bid.bidder.toString() === userId;
    
    if (!isSeller && !isBuyer) {
      return res.status(403).json({ message: 'Unauthorized - you are not part of this negotiation' });
    }

    // Update bid with counter offer
    bid.status = 'counter_offer';
    bid.amount = amount; // Update the current amount
    bid.updated_at = new Date();
    
    // Add to negotiation history
    if (!bid.negotiationHistory) {
      bid.negotiationHistory = [];
    }
    bid.negotiationHistory.push({
      amount: amount,
      proposedBy: userId,
      proposedByRole: isSeller ? 'seller' : 'buyer',
      message: message || 'Counter offer',
      created_at: new Date()
    });
    
    // Add comment if message provided
    if (message) {
      bid.comments.push({
        text: message,
        user: userId,
        created_at: new Date()
      });
    }
    
    await bid.save();

    // Create notification for the other party
    const recipientId = isSeller ? bid.bidder : watch.owner;
    const watchDetails = bid.watch;
    
    // Get the sender's info for the notification message
    const sender = await User.findById(userId);
    
    await Notification.createNotification({
      user: recipientId,
      type: 'counter_offer',
      title: 'Counter Offer Received',
      message: isSeller 
        ? `${sender.name || sender.email} has made a counter offer of $${amount.toLocaleString()} for ${watchDetails.brand} ${watchDetails.model}`
        : `${sender.name || sender.email} has made a counter offer of $${amount.toLocaleString()} for ${watchDetails.brand} ${watchDetails.model}`,
      relatedEntity: {
        entityType: 'bid',
        entityId: bid._id
      }
    });

    res.json({ message: 'Counter offer sent successfully', bid });
  } catch (error) {
    console.error('Error sending counter offer:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
