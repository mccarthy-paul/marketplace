import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../db/index.js';
import Watch from '../db/watchModel.js';
import User from '../db/userModel.js';

async function auditWatches() {
  try {
    // Connect to database
    await connectDB();
    console.log('Connected to database');
    
    // Get all watches with owner populated
    const watches = await Watch.find({}).populate('owner', 'name email junopay_client_id company_name');
    
    console.log(`\nTotal watches in system: ${watches.length}`);
    
    // Categorize watches
    const watchesWithJunoPay = [];
    const watchesWithoutJunoPay = [];
    const watchesWithoutOwner = [];
    
    for (const watch of watches) {
      if (!watch.owner) {
        watchesWithoutOwner.push(watch);
      } else if (watch.owner.junopay_client_id) {
        watchesWithJunoPay.push(watch);
      } else {
        watchesWithoutJunoPay.push(watch);
      }
    }
    
    // Report results
    console.log(`\n=== AUDIT RESULTS ===`);
    console.log(`✅ Watches with JunoPay-enabled owners: ${watchesWithJunoPay.length}`);
    console.log(`❌ Watches WITHOUT JunoPay-enabled owners: ${watchesWithoutJunoPay.length}`);
    console.log(`⚠️  Watches without any owner: ${watchesWithoutOwner.length}`);
    
    // Show details of problematic watches
    if (watchesWithoutJunoPay.length > 0) {
      console.log(`\n=== Watches WITHOUT JunoPay (Cannot be purchased) ===`);
      watchesWithoutJunoPay.forEach(watch => {
        console.log(`- ${watch.brand} ${watch.model} (ID: ${watch._id})`);
        console.log(`  Owner: ${watch.owner.name || watch.owner.email} (User ID: ${watch.owner._id})`);
        console.log(`  Reference: ${watch.reference_number || 'N/A'}`);
        console.log(`  Price: $${watch.price || watch.currentBid || 'N/A'}`);
      });
    }
    
    if (watchesWithoutOwner.length > 0) {
      console.log(`\n=== Watches WITHOUT Owner ===`);
      watchesWithoutOwner.forEach(watch => {
        console.log(`- ${watch.brand} ${watch.model} (ID: ${watch._id})`);
        console.log(`  Reference: ${watch.reference_number || 'N/A'}`);
        console.log(`  Price: $${watch.price || watch.currentBid || 'N/A'}`);
      });
    }
    
    // Check all users
    console.log(`\n=== USER AUDIT ===`);
    const users = await User.find({});
    const usersWithJunoPay = users.filter(u => u.junopay_client_id);
    const usersWithoutJunoPay = users.filter(u => !u.junopay_client_id);
    
    console.log(`Total users: ${users.length}`);
    console.log(`Users with JunoPay: ${usersWithJunoPay.length}`);
    console.log(`Users WITHOUT JunoPay: ${usersWithoutJunoPay.length}`);
    
    if (usersWithoutJunoPay.length > 0) {
      console.log(`\nUsers without JunoPay client ID:`);
      usersWithoutJunoPay.forEach(user => {
        console.log(`- ${user.name || user.email} (ID: ${user._id})`);
      });
    }
    
    // Summary
    console.log(`\n=== SUMMARY ===`);
    const purchasablePercentage = (watchesWithJunoPay.length / watches.length * 100).toFixed(1);
    console.log(`${purchasablePercentage}% of watches can be purchased through JunoPay`);
    
    if (watchesWithoutJunoPay.length > 0 || watchesWithoutOwner.length > 0) {
      console.log(`\n⚠️  ACTION REQUIRED:`);
      console.log(`${watchesWithoutJunoPay.length + watchesWithoutOwner.length} watches need attention`);
      console.log(`Affected users need to log in with JunoPay to enable transactions for their watches.`);
    }
    
  } catch (error) {
    console.error('Error during audit:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the audit
auditWatches();