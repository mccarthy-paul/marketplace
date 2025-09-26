import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './db/index.js';
import Watch from './db/watchModel.js';

const CLOUD_STORAGE_BASE = 'https://storage.googleapis.com/juno-marketplace-watches';

async function updateImageUrls() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Get all watches
    const watches = await Watch.find({});
    console.log(`Found ${watches.length} watches to update`);

    for (const watch of watches) {
      let updated = false;

      // Update main imageUrl
      if (watch.imageUrl && watch.imageUrl.startsWith('/public/uploads/watches/')) {
        const filename = watch.imageUrl.split('/').pop();
        watch.imageUrl = `${CLOUD_STORAGE_BASE}/${filename}`;
        updated = true;
      }

      // Update images array
      if (watch.images && watch.images.length > 0) {
        watch.images = watch.images.map(img => {
          if (img.startsWith('/public/uploads/watches/')) {
            const filename = img.split('/').pop();
            return `${CLOUD_STORAGE_BASE}/${filename}`;
          }
          return img;
        });
        updated = true;
      }

      if (updated) {
        await watch.save();
        console.log(`Updated URLs for: ${watch.brand} ${watch.model}`);
      }
    }

    console.log('✅ All image URLs updated successfully!');

  } catch (error) {
    console.error('Error updating image URLs:', error);
  } finally {
    mongoose.connection.close();
  }
}

updateImageUrls();