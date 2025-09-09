import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Transaction from '../api/db/transactionModel.js';
import User from '../api/db/userModel.js';
import Watch from '../api/db/watchModel.js';

// Load environment variables
dotenv.config({ path: '../api/.env' });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxury-watch-marketplace';

async function checkTransactionStatus() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all transactions
    const transactions = await Transaction.find({})
      .populate('buyer', 'name email')
      .populate('watch', 'brand model');

    console.log(`Found ${transactions.length} transactions:`);
    
    for (const transaction of transactions) {
      console.log('\n--- Transaction Details ---');
      console.log(`Transaction ID: ${transaction.applicationTransactionId}`);
      console.log(`Buyer: ${transaction.buyer?.name} (${transaction.buyer?.email})`);
      console.log(`Watch: ${transaction.watch?.brand} ${transaction.watch?.model}`);
      console.log(`Purchase Price: $${transaction.purchasePrice}`);
      console.log(`Buyer Fee: $${transaction.buyerFee}`);
      console.log(`Total Price: $${transaction.totalPrice}`);
      console.log(`Status: ${transaction.status}`);
      console.log(`Created: ${transaction.created_at}`);
      console.log(`Updated: ${transaction.updated_at}`);
    }

  } catch (error) {
    console.error('Error checking transactions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

checkTransactionStatus();