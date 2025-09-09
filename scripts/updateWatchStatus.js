import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Watch from '../api/db/watchModel.js';

// Load environment variables
dotenv.config({ path: '../api/.env' });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxury-watch-marketplace';

async function updateWatchStatuses() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all sold watches
    const soldWatches = await Watch.find({ status: 'sold' });
    console.log(`Found ${soldWatches.length} sold watches`);

    // Update all sold watches to active
    const result = await Watch.updateMany(
      { status: 'sold' }, 
      { 
        status: 'active',
        updated_at: new Date()
      }
    );

    console.log(`Updated ${result.modifiedCount} watches from 'sold' to 'active'`);

    // Show updated watches
    const updatedWatches = await Watch.find({ status: 'active' }).select('brand model status');
    console.log('Active watches:');
    updatedWatches.forEach(watch => {
      console.log(`- ${watch.brand} ${watch.model}: ${watch.status}`);
    });

  } catch (error) {
    console.error('Error updating watch statuses:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateWatchStatuses();