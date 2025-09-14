import mongoose from 'mongoose';
import User from '../db/userModel.js';
import Watch from '../db/watchModel.js';
import Transaction from '../db/transactionModel.js';
import Notification from '../db/notificationModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function createPendingOrderNotifications() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all pending transactions without existing notifications
    const pendingTransactions = await Transaction.find({ 
      status: { $in: ['initiated', 'pending', 'Pending'] } 
    })
    .populate('buyer')
    .populate('seller')
    .populate('watch');

    console.log(`Found ${pendingTransactions.length} pending transactions`);

    for (const transaction of pendingTransactions) {
      if (!transaction.seller) {
        console.log(`Transaction ${transaction._id} has no seller, skipping`);
        continue;
      }

      // Check if notification already exists for this transaction
      const existingNotification = await Notification.findOne({
        user: transaction.seller._id,
        'relatedEntity.entityId': transaction._id,
        type: 'order_placed'
      });

      if (existingNotification) {
        console.log(`Notification already exists for transaction ${transaction._id}, skipping`);
        continue;
      }

      // Create notification for seller
      const notification = await Notification.createNotification({
        user: transaction.seller._id,
        type: 'order_placed',
        title: 'New Order Received',
        message: transaction.watch 
          ? `${transaction.buyer?.name || transaction.buyer?.email || 'A buyer'} has placed an order for your ${transaction.watch.brand} ${transaction.watch.model}`
          : `You have a pending order from ${transaction.buyer?.name || transaction.buyer?.email || 'a buyer'}`,
        relatedEntity: {
          entityType: 'order',
          entityId: transaction._id
        }
      });

      console.log(`Created notification for seller ${transaction.seller._id} about transaction ${transaction._id}`);
    }

    console.log('Finished creating pending order notifications');
    process.exit(0);
  } catch (error) {
    console.error('Error creating notifications:', error);
    process.exit(1);
  }
}

createPendingOrderNotifications();