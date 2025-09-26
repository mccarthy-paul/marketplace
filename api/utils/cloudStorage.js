import { Storage } from '@google-cloud/storage';
import multer from 'multer';
import path from 'path';

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: 'juno-marketplace',
  // In production, use Application Default Credentials (ADC)
  // which are automatically available in Cloud Run
});

const bucket = storage.bucket('juno-marketplace-watches');

// Custom storage engine for multer that uploads to GCS
const multerGoogleStorage = {
  _handleFile: function (req, file, cb) {
    const filename = `watchImages-${Date.now()}${path.extname(file.originalname)}`;
    const blob = bucket.file(filename);
    const stream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    stream.on('error', (err) => {
      cb(err);
    });

    stream.on('finish', () => {
      // Make the file publicly accessible
      blob.makePublic().then(() => {
        // Return the public URL
        const publicUrl = `https://storage.googleapis.com/juno-marketplace-watches/${filename}`;
        cb(null, {
          path: publicUrl,
          filename: filename,
          size: blob.metadata.size,
        });
      }).catch(err => {
        cb(err);
      });
    });

    file.stream.pipe(stream);
  },
  _removeFile: function (req, file, cb) {
    const blob = bucket.file(file.filename);
    blob.delete().then(() => {
      cb(null);
    }).catch(err => {
      cb(err);
    });
  }
};

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

// Configure multer for Google Cloud Storage
export const uploadToGCS = multer({
  storage: multerGoogleStorage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
    files: 5 // Maximum 5 files
  }
});

// Helper function to delete an image from GCS
export const deleteFromGCS = async (filename) => {
  try {
    // Extract filename from full URL if necessary
    if (filename.startsWith('https://storage.googleapis.com/')) {
      filename = filename.split('/').pop();
    }

    await bucket.file(filename).delete();
    console.log(`Deleted ${filename} from Google Cloud Storage`);
  } catch (error) {
    console.error(`Error deleting ${filename} from GCS:`, error);
    throw error;
  }
};

// Helper function to upload buffer/stream directly
export const uploadBufferToGCS = async (buffer, filename, mimeType) => {
  const blob = bucket.file(filename);
  const stream = blob.createWriteStream({
    resumable: false,
    metadata: {
      contentType: mimeType,
    },
  });

  return new Promise((resolve, reject) => {
    stream.on('error', reject);
    stream.on('finish', async () => {
      try {
        await blob.makePublic();
        const publicUrl = `https://storage.googleapis.com/juno-marketplace-watches/${filename}`;
        resolve(publicUrl);
      } catch (error) {
        reject(error);
      }
    });
    stream.end(buffer);
  });
};

export default uploadToGCS;