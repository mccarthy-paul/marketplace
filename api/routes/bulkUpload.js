import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import Watch from '../db/watchModel.js';
import mongoose from 'mongoose';

const router = express.Router();

// Configure multer for bulk upload
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB total limit
    files: 500 // Maximum 500 files (for images)
  },
  fileFilter: (req, file, cb) => {
    // Accept CSV files
    if (file.fieldname === 'csv') {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext === '.csv') {
        cb(null, true);
      } else {
        cb(new Error('Only CSV files are allowed'));
      }
    }
    // Accept image files
    else if (file.fieldname === 'images') {
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExtensions.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid image format'));
      }
    } else {
      cb(null, false);
    }
  }
});

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
}

// Helper function to map images to watches
function mapImagesToWatches(images, watches) {
  const imageMap = {};

  // Group images by SKU
  images.forEach(image => {
    const filename = image.originalname;
    // Extract SKU from filename (expecting format: SKU_1.jpg)
    const matches = filename.match(/^(.+?)_(\d+)\.(jpg|jpeg|png|webp)$/i);

    if (matches) {
      const sku = matches[1];
      const index = parseInt(matches[2]);

      if (!imageMap[sku]) {
        imageMap[sku] = [];
      }

      imageMap[sku].push({
        index,
        buffer: image.buffer,
        originalname: image.originalname,
        mimetype: image.mimetype
      });
    }
  });

  // Sort images by index for each SKU
  Object.keys(imageMap).forEach(sku => {
    imageMap[sku].sort((a, b) => a.index - b.index);
  });

  return imageMap;
}

// Helper function to save image files
async function saveImage(imageData, sku, index) {
  const ext = path.extname(imageData.originalname).toLowerCase();
  const filename = `watch-${sku}-${Date.now()}-${index}${ext}`;
  const filepath = path.join('public', 'uploads', 'watches', filename);

  try {
    // Ensure directory exists
    await fs.mkdir(path.join('public', 'uploads', 'watches'), { recursive: true });

    // Save file
    await fs.writeFile(filepath, imageData.buffer);

    return `/public/uploads/watches/${filename}`;
  } catch (error) {
    console.error('Error saving image:', error);
    return null;
  }
}

// Validate bulk upload data
router.post('/validate', isAuthenticated, upload.single('csv'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'CSV file is required' });
    }

    const csvContent = req.file.buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    if (lines.length < 2) {
      return res.status(400).json({ message: 'CSV file must contain headers and at least one data row' });
    }

    const headers = lines[0].split(',').map(h => h.trim());
    const requiredFields = ['SKU', 'Brand', 'Model', 'Reference_Number'];

    // Check for required headers
    const missingHeaders = requiredFields.filter(field => !headers.includes(field));
    if (missingHeaders.length > 0) {
      return res.status(400).json({
        message: `Missing required headers: ${missingHeaders.join(', ')}`
      });
    }

    const validationErrors = [];
    const validWatches = [];
    const skus = new Set();

    // Parse and validate each row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      const rowErrors = [];

      // Validate required fields
      requiredFields.forEach(field => {
        if (!row[field]) {
          rowErrors.push(`${field} is required`);
        }
      });

      // Check for duplicate SKUs
      if (row.SKU) {
        if (skus.has(row.SKU)) {
          rowErrors.push(`Duplicate SKU: ${row.SKU}`);
        } else {
          skus.add(row.SKU);

          // Check if SKU already exists in database
          const existingWatch = await Watch.findOne({
            'metadata.sku': row.SKU,
            owner: req.session.user._id
          });

          if (existingWatch) {
            rowErrors.push(`SKU ${row.SKU} already exists in your inventory`);
          }
        }
      }

      // Validate numeric fields
      if (row.Price && isNaN(parseFloat(row.Price))) {
        rowErrors.push('Price must be a number');
      }

      if (row.Starting_Bid && isNaN(parseFloat(row.Starting_Bid))) {
        rowErrors.push('Starting Bid must be a number');
      }

      if (row.Year) {
        const year = parseInt(row.Year);
        if (isNaN(year) || year < 1900 || year > new Date().getFullYear() + 1) {
          rowErrors.push('Invalid year');
        }
      }

      if (rowErrors.length > 0) {
        validationErrors.push({
          row: i + 1,
          sku: row.SKU,
          errors: rowErrors
        });
      } else {
        validWatches.push(row);
      }
    }

    res.json({
      valid: validationErrors.length === 0,
      totalRows: lines.length - 1,
      validRows: validWatches.length,
      errors: validationErrors,
      summary: {
        total: lines.length - 1,
        valid: validWatches.length,
        invalid: validationErrors.length
      }
    });

  } catch (error) {
    console.error('Validation error:', error);
    res.status(500).json({ message: 'Error validating CSV file' });
  }
});

// Process bulk upload
router.post('/process', isAuthenticated, upload.fields([
  { name: 'csv', maxCount: 1 },
  { name: 'images', maxCount: 500 }
]), async (req, res) => {
  try {
    if (!req.files || !req.files.csv) {
      return res.status(400).json({ message: 'CSV file is required' });
    }

    const userId = req.session.user._id;
    const User = mongoose.model('User');
    const user = await User.findById(userId);

    if (!user.junopay_client_id) {
      return res.status(400).json({
        message: 'You must log in with JunoPay before bulk uploading. Please log out and log back in using JunoPay.'
      });
    }

    // Parse CSV
    const csvContent = req.files.csv[0].buffer.toString('utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());

    // Map images to SKUs
    const imageMap = req.files.images ? mapImagesToWatches(req.files.images, null) : {};

    const results = {
      successful: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      created: []
    };

    // Process each row
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Skip empty rows
      if (!row.SKU || !row.Brand || !row.Model) {
        results.skipped++;
        continue;
      }

      try {
        // Check for duplicate
        const existingWatch = await Watch.findOne({
          'metadata.sku': row.SKU,
          owner: userId
        });

        if (existingWatch) {
          results.skipped++;
          results.errors.push({
            row: i + 1,
            sku: row.SKU,
            error: 'SKU already exists'
          });
          continue;
        }

        // Process images for this SKU
        const watchImages = [];
        if (imageMap[row.SKU]) {
          for (let j = 0; j < Math.min(imageMap[row.SKU].length, 5); j++) {
            const imagePath = await saveImage(imageMap[row.SKU][j], row.SKU, j + 1);
            if (imagePath) {
              watchImages.push(imagePath);
            }
          }
        }

        // Parse classifications
        let classifications = [];
        if (row.Classifications) {
          classifications = row.Classifications.split(';').map(c => c.trim()).filter(c => c);
        }

        // Create watch object
        const newWatch = new Watch({
          brand: row.Brand,
          model: row.Model,
          reference_number: row.Reference_Number,
          year: row.Year ? parseInt(row.Year) : null,
          condition: row.Condition || 'Good',
          description: row.Description,
          price: row.Price ? parseFloat(row.Price) : null,
          currentBid: row.Starting_Bid ? parseFloat(row.Starting_Bid) : 0,
          currency: row.Currency || 'USD',
          classifications: classifications,
          imageUrl: watchImages[0] || null,
          images: watchImages,
          seller: userId,
          owner: userId,
          status: 'active',
          metadata: {
            sku: row.SKU,
            case_size: row.Case_Size,
            case_material: row.Case_Material,
            dial_color: row.Dial_Color,
            movement: row.Movement,
            bracelet_material: row.Bracelet_Material,
            box_papers: row.Box_Papers,
            imported_via: 'bulk_upload',
            imported_at: new Date()
          }
        });

        await newWatch.save();

        results.successful++;
        results.created.push({
          sku: row.SKU,
          id: newWatch._id,
          brand: row.Brand,
          model: row.Model
        });

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        results.failed++;
        results.errors.push({
          row: i + 1,
          sku: row.SKU,
          error: error.message
        });
      }
    }

    // Return results
    res.json({
      message: 'Bulk upload completed',
      results: results,
      summary: {
        total: lines.length - 1,
        successful: results.successful,
        failed: results.failed,
        skipped: results.skipped
      }
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ message: 'Error processing bulk upload' });
  }
});

// Download template
router.get('/template', (req, res) => {
  const templatePath = path.join(process.cwd(), 'public', 'templates', 'watch-inventory-template.csv');
  res.download(templatePath, 'watch-inventory-template.csv');
});

// Get bulk upload status (for future implementation with job queues)
router.get('/status/:jobId', isAuthenticated, async (req, res) => {
  // This would be implemented with a job queue system like Bull
  // For now, return a placeholder response
  res.json({
    jobId: req.params.jobId,
    status: 'completed',
    progress: 100,
    message: 'Upload completed successfully'
  });
});

export default router;