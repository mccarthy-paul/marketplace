import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Transaction from '../api/db/transactionModel.js';
import User from '../api/db/userModel.js';

// Load environment variables
dotenv.config({ path: '../api/.env' });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxury-watch-marketplace';

async function updateTransactionBuyerFee() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find transactions without buyerFee set
    const transactions = await Transaction.find({ 
      $or: [
        { buyerFee: { $exists: false } },
        { buyerFee: '0' },
        { buyerFee: '' }
      ]
    }).populate('buyer');

    console.log(`Found ${transactions.length} transactions to update`);

    for (const transaction of transactions) {
      if (transaction.buyer && transaction.buyer.buyer_fee && transaction.purchasePrice) {
        // Calculate buyer fee (1% of purchase price)
        const calculatedBuyerFee = (parseFloat(transaction.purchasePrice) * (transaction.buyer.buyer_fee || 0)) / 100;
        
        console.log(`Updating transaction ${transaction.applicationTransactionId}:`);
        console.log(`  Purchase Price: $${transaction.purchasePrice}`);
        console.log(`  Buyer Fee Rate: ${transaction.buyer.buyer_fee}%`);
        console.log(`  Calculated Buyer Fee: $${calculatedBuyerFee}`);
        
        // Update the transaction
        await Transaction.findByIdAndUpdate(transaction._id, {
          buyerFee: calculatedBuyerFee.toString(),
          updated_at: new Date()
        });
        
        console.log(`✅ Updated transaction ${transaction.applicationTransactionId}`);
      } else {
        console.log(`⚠️  Skipping transaction ${transaction.applicationTransactionId} - missing buyer info`);
      }
    }

    console.log('✅ Transaction update complete');

  } catch (error) {
    console.error('Error updating transactions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateTransactionBuyerFee();