import express from 'express';
import Listing from '../db/listingModel.js';

const router = express.Router();

// Middleware to check if user is authenticated (assuming it's defined in api/index.js)
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Get all listings
router.get('/', async (req, res) => {
  try {
    const listings = await Listing.find().populate('watch_id').populate('seller_id');
    res.json(listings);
  } catch (err) {
    console.error('Error fetching listings:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific listing
router.get('/:id', async (req, res) => {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId).populate('watch_id').populate('seller_id');
    if (listing) {
      res.json(listing);
    } else {
      res.status(404).json({ message: 'Listing not found' });
    }
  } catch (err) {
    console.error('Error fetching listing:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new listing
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { watch_id, price, is_available } = req.body;
    const seller_id = req.session.user._id; // Use MongoDB _id
    const newListing = new Listing({ watch_id, seller_id, price, is_available });
    await newListing.save();
    res.status(201).json(newListing);
  } catch (err) {
    console.error('Error creating listing:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a listing
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const listingId = req.params.id;
    const { watch_id, price, is_available } = req.body;
    const updatedListing = await Listing.findByIdAndUpdate(listingId, { watch_id, price, is_available, updated_at: new Date() }, { new: true });
    if (updatedListing) {
      res.json(updatedListing);
    } else {
      res.status(404).json({ message: 'Listing not found' });
    }
  } catch (err) {
    console.error('Error updating listing:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a listing
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const listingId = req.params.id;
    const deletedListing = await Listing.findByIdAndDelete(listingId);
    if (deletedListing) {
      res.sendStatus(204);
    } else {
      res.status(404).json({ message: 'Listing not found' });
    }
  } catch (err) {
    console.error('Error deleting listing:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
