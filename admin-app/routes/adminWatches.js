import express from 'express';
import Watch from '../../api/db/watchModel.js';
import User from '../../api/db/userModel.js';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '../images'); // Store in the main app's images directory
  },
  filename: (req, file, cb) => {
    const uniqueName = `watch-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

// Middleware to check admin authentication
function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.is_admin) {
    next();
  } else {
    res.status(401).json({ message: 'Admin access required' });
  }
}

// Create new watch (admin)
router.post('/', requireAdmin, upload.single('watchImage'), async (req, res) => {
  try {
    const {
      brand,
      model,
      reference_number,
      description,
      year,
      condition,
      currentBid,
      startingPrice,
      price,
      seller,
      owner,
      status
    } = req.body;

    // Validate required fields
    if (!brand || !model || !reference_number || !seller || !owner) {
      return res.status(400).json({ 
        message: 'Missing required fields: brand, model, reference_number, seller, and owner are required' 
      });
    }

    // Check if reference number already exists
    const existingWatch = await Watch.findOne({ reference_number });
    if (existingWatch) {
      return res.status(409).json({ 
        message: 'A watch with this reference number already exists' 
      });
    }

    // Parse classifications if provided
    let classifications = [];
    if (req.body.classifications) {
      try {
        classifications = JSON.parse(req.body.classifications);
      } catch (e) {
        console.error('Error parsing classifications:', e);
      }
    }

    // Create watch object
    const watchData = {
      brand,
      model,
      reference_number,
      description,
      year: year ? parseInt(year) : undefined,
      condition: condition || 'Excellent',
      currentBid: currentBid ? parseFloat(currentBid) : 0,
      startingPrice: startingPrice ? parseFloat(startingPrice) : undefined,
      price: price ? parseFloat(price) : undefined,
      seller,
      owner,
      status: status || 'active',
      classifications,
      created_at: new Date(),
      updated_at: new Date()
    };

    // Add image URL if file was uploaded
    if (req.file) {
      watchData.imageUrl = `/images/${req.file.filename}`;
    }

    // Create and save the watch
    const newWatch = new Watch(watchData);
    const savedWatch = await newWatch.save();

    // Populate seller and owner data for response
    const populatedWatch = await Watch.findById(savedWatch._id)
      .populate('seller', 'name email company_name')
      .populate('owner', 'name email company_name');

    console.log('New watch created by admin:', populatedWatch._id);
    res.status(201).json(populatedWatch);
  } catch (error) {
    console.error('Error creating watch:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ message: `Validation error: ${errors.join(', ')}` });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all watches (admin)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const watches = await Watch.find({})
      .populate('seller', 'name email company_name')
      .populate('owner', 'name email company_name')
      .sort({ created_at: -1 });
    
    res.json(watches);
  } catch (error) {
    console.error('Error fetching watches:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single watch (admin)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const watch = await Watch.findById(req.params.id)
      .populate('seller', 'name email company_name')
      .populate('owner', 'name email company_name');
    
    if (!watch) {
      return res.status(404).json({ message: 'Watch not found' });
    }
    
    res.json(watch);
  } catch (error) {
    console.error('Error fetching watch:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update watch (admin) - now supports multiple images
router.put('/:id', requireAdmin, upload.array('watchImages', 10), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Parse classifications if provided
    if (updateData.classifications && typeof updateData.classifications === 'string') {
      try {
        updateData.classifications = JSON.parse(updateData.classifications);
      } catch (e) {
        console.error('Error parsing classifications:', e);
        updateData.classifications = [];
      }
    }

    // Parse existing images if provided
    if (updateData.existingImages) {
      try {
        const existingImages = JSON.parse(updateData.existingImages);
        updateData.images = existingImages;
        // Update primary image (for backward compatibility)
        if (existingImages.length > 0) {
          updateData.imageUrl = existingImages[0];
        }
      } catch (e) {
        console.error('Error parsing existing images:', e);
      }
      delete updateData.existingImages; // Remove from update data
    }

    // Add new uploaded images
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/images/${file.filename}`);
      updateData.images = [...(updateData.images || []), ...newImages];

      // Update primary image if it's the first image
      if (!updateData.imageUrl && updateData.images.length > 0) {
        updateData.imageUrl = updateData.images[0];
      }
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date();

    const watch = await Watch.findByIdAndUpdate(id, updateData, { new: true })
      .populate('seller', 'name email company_name')
      .populate('owner', 'name email company_name');

    if (!watch) {
      return res.status(404).json({ message: 'Watch not found' });
    }

    console.log('Watch updated by admin:', watch._id);
    res.json(watch);
  } catch (error) {
    console.error('Error updating watch:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete watch (admin)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const watch = await Watch.findByIdAndDelete(req.params.id);
    
    if (!watch) {
      return res.status(404).json({ message: 'Watch not found' });
    }
    
    console.log('Watch deleted by admin:', watch._id);
    res.json({ message: 'Watch deleted successfully' });
  } catch (error) {
    console.error('Error deleting watch:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;