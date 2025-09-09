console.log('Loading watches.js route...');
import express from 'express';
import Watch from '../db/watchModel.js';
import multer from 'multer';
import path from 'path';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/watches'); // Uploads will be stored in public/uploads/watches
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const upload = multer({ storage });

console.log('Reached watchesRouter');

// Middleware to check if user is authenticated (assuming it's defined in api/index.js)
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Get all watches
router.get('/', async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://4c153d847f98.ngrok-free.app'); // Manually add CORS header
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Add allowed methods
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Add allowed headers
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials

  console.log('Inside api get all watches...');
  try {
    const watches = await Watch.find().populate('owner', 'email name company_name'); // Populate owner with email, name, and company name
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


// Create a new watch (Admin only)
router.post('/', isAuthenticated, upload.single('watchImage'), async (req, res) => {
  if (!req.session.user.is_admin) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  try {
    const { brand, model, reference_number, description, year, condition, seller } = req.body; // Include seller
    const imageUrl = req.file ? `/uploads/watches/${req.file.filename}` : null; // Save image path

    const newWatch = new Watch({ brand, model, reference_number, description, year, condition, imageUrl, seller }); // Include seller
    await newWatch.save();
    res.status(201).json(newWatch);
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
    const { brand, model, reference_number, description, year, condition, seller, owner } = req.body; // Include seller and owner
    const updateData = { brand, model, reference_number, description, year, condition, seller, owner, updated_at: new Date() }; // Include seller and owner

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

// Create a new watch (Regular users)
router.post('/user', isAuthenticated, upload.single('watchImage'), async (req, res) => {
  try {
    const { brand, model, reference_number, description, year, condition, startingPrice, price, status } = req.body;
    const imageUrl = req.file ? `/uploads/watches/${req.file.filename}` : null;
    const userId = req.session.user._id;

    // Create watch with current user as both seller and owner
    const newWatch = new Watch({ 
      brand, 
      model, 
      reference_number, 
      description, 
      year, 
      condition, 
      imageUrl, 
      seller: userId, 
      owner: userId,
      currentBid: startingPrice || 0,
      price: price || null,
      status: status || 'active'
    });
    
    await newWatch.save();
    
    // Populate owner details before sending response
    const populatedWatch = await Watch.findById(newWatch._id).populate('owner', 'name email company_name');
    
    res.status(201).json(populatedWatch);
  } catch (err) {
    console.error('Error creating watch:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
