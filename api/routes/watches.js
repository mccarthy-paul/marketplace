console.log('Loading watches.js route...');
import express from 'express';
import mongoose from 'mongoose';
import Watch from '../db/watchModel.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/watches'); // Uploads will be stored in public/uploads/watches (relative to api directory)
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

// File filter to accept specific image formats including WebP
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5 // Maximum 5 files
  }
});

console.log('Reached watchesRouter');

// Middleware to check if user is authenticated (assuming it's defined in api/index.js)
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Get all watches with filtering support
router.get('/', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://a2842d04cca8.ngrok-free.app'); // Manually add CORS header
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Add allowed methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Add allowed headers
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials

  console.log('Inside api get all watches...');
  console.log('Query params:', req.query);
  
  try {
    // Build filter object from query parameters
    const filter = {};
    
    // Filter by brand (make)
    if (req.query.brand) {
      filter.brand = { $regex: new RegExp(req.query.brand, 'i') };
    }
    
    // Filter by model
    if (req.query.model) {
      filter.model = { $regex: new RegExp(req.query.model, 'i') };
    }
    
    // Filter by price range
    // Check both 'price' and 'currentBid' fields for price filtering
    if (req.query.minPrice || req.query.maxPrice) {
      const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : null;
      const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : null;
      
      // Build conditions for both price and currentBid
      const priceConditions = [];
      
      if (minPrice !== null && maxPrice !== null) {
        // Both min and max specified
        priceConditions.push({
          $or: [
            { price: { $exists: true, $ne: null, $gte: minPrice, $lte: maxPrice } },
            { currentBid: { $exists: true, $ne: null, $gte: minPrice, $lte: maxPrice } }
          ]
        });
      } else if (minPrice !== null) {
        // Only min price specified
        priceConditions.push({
          $or: [
            { price: { $exists: true, $ne: null, $gte: minPrice } },
            { currentBid: { $exists: true, $ne: null, $gte: minPrice } }
          ]
        });
      } else if (maxPrice !== null) {
        // Only max price specified
        priceConditions.push({
          $or: [
            { price: { $exists: true, $ne: null, $lte: maxPrice } },
            { currentBid: { $exists: true, $ne: null, $lte: maxPrice } }
          ]
        });
      }
      
      // Apply the price filter
      if (priceConditions.length > 0) {
        Object.assign(filter, priceConditions[0]);
      }
    }
    
    // Filter by owner/broker (company name)
    let ownerFilter = null;
    if (req.query.broker) {
      // First find users matching the broker/company name
      const User = mongoose.model('User');
      const matchingUsers = await User.find({
        company_name: { $regex: new RegExp(req.query.broker, 'i') }
      }).select('_id');
      
      if (matchingUsers.length > 0) {
        filter.owner = { $in: matchingUsers.map(u => u._id) };
      } else {
        // If no users match, return empty result
        return res.json([]);
      }
    }
    
    console.log('Applied filters:', filter);
    
    const watches = await Watch.find(filter).populate('owner', 'email name company_name junopay_client_id sellerStats');
    res.json(watches);
  } catch (err) {
    console.error('Error fetching watches:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get a specific watch
router.get('/:id', async (req, res) => {
  try {
    const watchId = req.params.id;
    const watch = await Watch.findById(watchId).populate('owner', 'email name company_name junopay_client_id'); // Populate owner with email, name, company name and junopay_client_id
    if (watch) {
      res.json(watch);
    } else {
      res.status(404).json({ message: 'Watch not found' });
    }
  } catch (err) {
    console.error('Error fetching watch:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Buy a watch
router.post('/:id/buy', isAuthenticated, async (req, res) => {
  try {
    const watchId = req.params.id;
    const userId = req.session.user._id; // Assuming user ID is available from isAuthenticated middleware

    const watch = await Watch.findById(watchId);

    if (!watch) {
      return res.status(404).json({ message: 'Watch not found' });
    }

    if (watch.status !== 'active') {
      return res.status(400).json({ message: 'Watch is not available for purchase' });
    }

    // Update watch status and buyer
    watch.status = 'sold';
    watch.buyer = userId;
    await watch.save();

    res.json({ message: 'Watch purchased successfully', watch });

  } catch (err) {
    console.error('Error buying watch:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// Create a new watch (Admin only) - now supports multiple images
router.post('/', isAuthenticated, upload.array('watchImages', 5), async (req, res) => {
  if (!req.session.user.is_admin) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const { brand, model, reference_number, description, year, condition, seller, owner, price, startingPrice, currency } = req.body;
    
    // If owner is specified, validate they have JunoPay client ID
    let ownerId = owner || seller || req.session.user._id;
    
    const User = mongoose.model('User');
    const ownerUser = await User.findById(ownerId);
    
    if (!ownerUser) {
      return res.status(400).json({ message: 'Invalid owner specified' });
    }
    
    if (!ownerUser.junopay_client_id) {
      return res.status(400).json({ 
        message: `The specified owner (${ownerUser.name || ownerUser.email}) must log in with JunoPay before watches can be listed for them.` 
      });
    }
    
    // Handle multiple images
    const images = req.files ? req.files.map(file => `/public/uploads/watches/${file.filename}`) : [];
    const imageUrl = images.length > 0 ? images[0] : null; // First image as primary

    const newWatch = new Watch({ 
      brand, 
      model, 
      reference_number, 
      description, 
      year, 
      condition, 
      imageUrl, 
      images,
      seller: seller || ownerId,
      owner: ownerId,
      price: price || null,
      currentBid: startingPrice || 0,
      currency: currency || 'USD',
      status: 'active'
    });
    
    await newWatch.save();
    
    // Populate owner details including junopay_client_id
    const populatedWatch = await Watch.findById(newWatch._id).populate('owner', 'name email company_name junopay_client_id');
    
    res.status(201).json(populatedWatch);
  } catch (err) {
    console.error('Error creating watch:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a watch (Admin only)
router.put('/:id', isAuthenticated, upload.single('watchImage'), async (req, res) => {
  if (!req.session.user.is_admin) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const watchId = req.params.id;
    const { brand, model, reference_number, description, year, condition, seller, owner, price, currentBid, currency } = req.body;
    const updateData = { brand, model, reference_number, description, year, condition, seller, owner, price, currentBid, currency, updated_at: new Date() };

    if (req.file) {
      updateData.imageUrl = `/uploads/watches/${req.file.filename}`; // Update image path if a new image is uploaded
    }

    const updatedWatch = await Watch.findByIdAndUpdate(watchId, updateData, { new: true });

    if (updatedWatch) {
      res.json(updatedWatch);
    } else {
      res.status(404).json({ message: 'Watch not found' });
    }
  } catch (err) {
    console.error('Error updating watch:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a watch (Admin only)
router.delete('/:id', isAuthenticated, async (req, res) => {
  if (!req.session.user.is_admin) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const watchId = req.params.id;
    const deletedWatch = await Watch.findByIdAndDelete(watchId);
    if (deletedWatch) {
      res.sendStatus(204);
    } else {
      res.status(404).json({ message: 'Watch not found' });
    }
  } catch (err) {
    console.error('Error deleting watch:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update a watch (Regular users - can only update their own watches)
router.put('/user/:id', isAuthenticated, upload.array('watchImages', 5), async (req, res) => {
  try {
    const watchId = req.params.id;
    const userId = req.session.user._id;

    // First check if the watch exists and belongs to the user
    const existingWatch = await Watch.findById(watchId);

    if (!existingWatch) {
      return res.status(404).json({ message: 'Watch not found' });
    }

    // Check ownership
    if (String(existingWatch.owner) !== String(userId) && String(existingWatch.seller) !== String(userId)) {
      return res.status(403).json({ message: 'You can only edit your own watches' });
    }

    const { brand, model, reference_number, description, year, condition, price, currentBid, currency, status, existingImages } = req.body;

    // Build update object
    const updateData = {
      brand,
      model,
      reference_number,
      description,
      year,
      condition,
      price: price || null,
      currentBid: currentBid || 0,
      currency: currency || 'USD',
      status: status || 'active',
      updated_at: new Date()
    };

    // Handle images
    let finalImages = [];

    // Parse existing images to keep
    if (existingImages) {
      try {
        const imagesToKeep = JSON.parse(existingImages);
        finalImages = Array.isArray(imagesToKeep) ? imagesToKeep : [];
      } catch (e) {
        console.error('Error parsing existing images:', e);
      }
    }

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/public/uploads/watches/${file.filename}`);
      finalImages = [...finalImages, ...newImages];
    }

    // Update images array
    if (finalImages.length > 0) {
      updateData.images = finalImages;
      updateData.imageUrl = finalImages[0]; // Keep first image as primary for backward compatibility
    }

    const updatedWatch = await Watch.findByIdAndUpdate(watchId, updateData, { new: true })
      .populate('owner', 'name email company_name junopay_client_id');

    res.json(updatedWatch);

  } catch (err) {
    console.error('Error updating watch:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new watch (Regular users) - now supports multiple images
router.post('/user', isAuthenticated, upload.array('watchImages', 5), async (req, res) => {
  try {
    console.log('Creating watch with request body:', req.body);
    const { brand, model, reference_number, description, year, condition, startingPrice, price, status, currency } = req.body;
    console.log('Extracted currency:', currency);
    const userId = req.session.user._id;
    
    // Check if user has JunoPay client ID
    const User = mongoose.model('User');
    const user = await User.findById(userId);
    
    if (!user.junopay_client_id) {
      return res.status(400).json({ 
        message: 'You must log in with JunoPay before creating a watch listing. Please log out and log back in using JunoPay.' 
      });
    }
    
    // Handle multiple images
    const images = req.files ? req.files.map(file => `/public/uploads/watches/${file.filename}`) : [];
    const imageUrl = images.length > 0 ? images[0] : null; // First image as primary for backward compatibility

    // Create watch with current user as both seller and owner
    const newWatch = new Watch({ 
      brand, 
      model, 
      reference_number, 
      description, 
      year, 
      condition, 
      imageUrl, 
      images, // Store all images
      seller: userId, 
      owner: userId,
      currentBid: startingPrice || 0,
      price: price || null,
      currency: currency || 'USD', // Include currency
      status: status || 'active'
    });
    
    console.log('Creating new watch with currency:', newWatch.currency);
    await newWatch.save();
    console.log('Saved watch with currency:', newWatch.currency);
    
    // Populate owner details including junopay_client_id before sending response
    const populatedWatch = await Watch.findById(newWatch._id).populate('owner', 'name email company_name junopay_client_id');
    
    res.status(201).json(populatedWatch);
  } catch (err) {
    console.error('Error creating watch:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
