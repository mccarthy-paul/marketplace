import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Transaction from '../api/db/transactionModel.js';

// Load environment variables
dotenv.config({ path: '../api/.env' });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/luxury-watch-marketplace';

async function fixTotalPrice() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find the transaction that needs fixing
    const transaction = await Transaction.findOne({ applicationTransactionId: 'JNT-e55eb0b5' });
    
    if (transaction) {
      const purchasePrice = parseFloat(transaction.purchasePrice);
      const shippingPrice = parseFloat(transaction.shippingPrice || '0');
      const buyerFee = parseFloat(transaction.buyerFee || '0');
      const correctTotalPrice = purchasePrice + shippingPrice + buyerFee;
      
      console.log(`Current data for ${transaction.applicationTransactionId}:`);
      console.log(`Purchase Price: $${purchasePrice}`);
      console.log(`Shipping Price: $${shippingPrice}`);
      console.log(`Buyer Fee: $${buyerFee}`);
      console.log(`Current Total: $${transaction.totalPrice}`);
      console.log(`Correct Total: $${correctTotalPrice}`);
      
      if (parseFloat(transaction.totalPrice) !== correctTotalPrice) {
        await Transaction.findByIdAndUpdate(transaction._id, {
          totalPrice: correctTotalPrice.toString(),
          updated_at: new Date()
        });
        
        console.log(`✅ Updated totalPrice to $${correctTotalPrice}`);
      } else {
        console.log('✅ Total price is already correct');
      }
    } else {
      console.log('❌ Transaction not found');
    }

  } catch (error) {
    console.error('Error fixing total price:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

fixTotalPrice();