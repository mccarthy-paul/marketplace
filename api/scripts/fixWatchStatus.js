import mongoose from 'mongoose';
import Watch from '../db/watchModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixWatchStatuses() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all watches with "Available" status
    const watchesWithAvailable = await Watch.find({ status: 'Available' });
    console.log(`Found ${watchesWithAvailable.length} watches with 'Available' status`);

    if (watchesWithAvailable.length > 0) {
      // Update all "Available" to "active"
      const result = await Watch.updateMany(
        { status: 'Available' },
        { status: 'active' }
      );
      console.log(`Updated ${result.modifiedCount} watches from 'Available' to 'active'`);
    }

    // Also fix any other non-standard statuses
    const invalidStatuses = await Watch.find({
      status: { $nin: ['active', 'sold', 'cancelled', 'pending'] }
    });
    
    if (invalidStatuses.length > 0) {
      console.log(`Found ${invalidStatuses.length} watches with invalid status values:`);
      const statusCounts = {};
      invalidStatuses.forEach(watch => {
        statusCounts[watch.status] = (statusCounts[watch.status] || 0) + 1;
      });
      console.log('Invalid status counts:', statusCounts);
      
      // Update all invalid statuses to 'active' (assuming they're available)
      const fixResult = await Watch.updateMany(
        { status: { $nin: ['active', 'sold', 'cancelled', 'pending'] } },
        { status: 'active' }
      );
      console.log(`Fixed ${fixResult.modifiedCount} watches with invalid statuses`);
    }

    // Show current status distribution
    const statusDistribution = await Watch.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    console.log('\nCurrent status distribution:');
    statusDistribution.forEach(item => {
      console.log(`  ${item._id}: ${item.count} watches`);
    });

    console.log('\nStatus fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing watch statuses:', error);
    process.exit(1);
  }
}

fixWatchStatuses();