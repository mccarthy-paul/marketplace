import express from 'express';
import User from '../db/userModel.js';
import Watch from '../db/watchModel.js';
import Transaction from '../db/transactionModel.js';
import Notification from '../db/notificationModel.js';
import junopayService from '../services/junopayService.js';

const router = express.Router();

// Middleware to check if user is authenticated
const requireAuth = async (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const user = await User.findById(req.session.user._id).select('+access_token +refresh_token');
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication check failed' });
  }
};

// Get user's JunoPay balance
router.get('/balance', requireAuth, async (req, res) => {
  try {
    const balance = await junopayService.getUserBalance(req.user);
    res.json({ success: true, balance });
  } catch (error) {
    console.error('Get balance error:', error);
    
    if (error.message === 'USER_REAUTH_REQUIRED') {
      return res.status(401).json({ 
        success: false, 
        error: 'Re-authentication required',
        reauth: true 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve balance' 
    });
  }
});

// Get user information
router.get('/user-info', requireAuth, async (req, res) => {
  try {
    const userInfo = await junopayService.getUserInfo(req.user);
    res.json({ success: true, userInfo });
  } catch (error) {
    console.error('Get user info error:', error);
    
    if (error.message === 'USER_REAUTH_REQUIRED') {
      return res.status(401).json({ 
        success: false, 
        error: 'Re-authentication required',
        reauth: true 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve user information' 
    });
  }
});

// Initiate a transaction (watch purchase)
router.post('/transaction/initiate', requireAuth, async (req, res) => {
  try {
    const {
      sellerClientId,
      productName,
      productCode,
      currency,
      purchasePrice,
      shippingPrice,
      totalPrice,
      buyerNote
    } = req.body;

    // Validate required fields
    if (!sellerClientId || !productName || !purchasePrice || !totalPrice) {
      return res.status(400).json({
        success: false,
        error: 'Missing required transaction details'
      });
    }

    const transactionDetails = {
      sellerClientId,
      productName,
      productCode,
      currency,
      purchasePrice,
      shippingPrice,
      totalPrice,
      buyerNote
    };

    // Call JunoPay API to initiate transaction
    const result = await junopayService.initiateTransaction(req.user, transactionDetails);
    console.log('JunoPay transaction initiated:', result);

    // Find the watch and seller for database record
    const watch = await Watch.findOne({ reference_number: productCode }).populate('owner');
    if (!watch) {
      console.warn('Watch not found for transaction, using productCode as reference');
    } else {
      // Check if watch is already sold or pending
      if (watch.status === 'sold' || watch.status === 'pending') {
        return res.status(400).json({
          success: false,
          error: `This watch is already ${watch.status}. Please refresh the page.`
        });
      }
      
      // Mark the watch as pending sale
      watch.status = 'pending';
      await watch.save();
      console.log(`Watch ${watch._id} marked as pending sale`);
    }

    const seller = await User.findOne({ junopay_client_id: sellerClientId });
    if (!seller) {
      console.warn('Seller not found for transaction');
    }

    // Calculate buyer fee (same as in junopayService)
    const calculatedBuyerFee = (parseFloat(purchasePrice) * (req.user.buyer_fee || 0)) / 100;

    // Save transaction record to database
    const transactionRecord = new Transaction({
      applicationTransactionId: result.applicationTransactionId || result.transactionId || result.id,
      watch: watch ? watch._id : null,
      buyer: req.user._id,
      seller: seller ? seller._id : null,
      buyerClientId: req.user.junopay_client_id,
      sellerClientId,
      productName,
      productCode,
      currency: currency || 'USD',
      purchasePrice,
      shippingPrice: shippingPrice || '0',
      totalPrice,
      buyerFee: calculatedBuyerFee.toString(),
      status: result.status || 'initiated',
      buyerNote
    });

    await transactionRecord.save();
    console.log('Transaction record saved to database:', transactionRecord._id);
    
    // Create notification for seller about pending order
    if (seller && watch) {
      await Notification.createNotification({
        user: seller._id,
        type: 'order_placed',
        title: 'New Order Received',
        message: `${req.user.name || req.user.email} has placed an order for your ${watch.brand} ${watch.model}`,
        relatedEntity: {
          entityType: 'order',
          entityId: transactionRecord._id
        }
      });
      console.log('Notification created for seller about pending order');
    }

    res.json({ success: true, transaction: result });
  } catch (error) {
    console.error('Initiate transaction error:', error);
    
    if (error.message === 'USER_REAUTH_REQUIRED') {
      return res.status(401).json({ 
        success: false, 
        error: 'Re-authentication required',
        reauth: true 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Failed to initiate transaction' 
    });
  }
});

// Get transaction details
router.get('/transaction/:transactionId', requireAuth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    if (!transactionId) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID is required'
      });
    }

    const transaction = await junopayService.getTransactionDetails(req.user, transactionId);
    res.json({ success: true, transaction });
  } catch (error) {
    console.error('Get transaction details error:', error);
    
    if (error.message === 'USER_REAUTH_REQUIRED') {
      return res.status(401).json({ 
        success: false, 
        error: 'Re-authentication required',
        reauth: true 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve transaction details' 
    });
  }
});

// Update transaction status (confirm/query)
router.put('/transaction/:transactionId', requireAuth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, note } = req.body;
    
    if (!transactionId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID and status are required'
      });
    }

    if (!['confirm', 'query', 'cancel'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be either "confirm", "query", or "cancel"'
      });
    }

    const result = await junopayService.updateTransaction(req.user, transactionId, status, note);
    
    // If transaction is confirmed, mark the watch as sold
    if (status === 'confirm') {
      const transaction = await Transaction.findOne({ applicationTransactionId: transactionId })
        .populate('buyer')
        .populate('seller')
        .populate('watch');
      
      if (transaction && transaction.watch) {
        await Watch.findByIdAndUpdate(transaction.watch, { 
          status: 'sold',
          updated_at: new Date()
        });
        console.log(`Watch ${transaction.watch._id} marked as sold after confirmation`);
        
        // Create notification for seller about completed sale
        if (transaction.seller) {
          await Notification.createNotification({
            user: transaction.seller._id,
            type: 'watch_sold',
            title: 'Watch Sold!',
            message: `Your ${transaction.watch.brand} ${transaction.watch.model} has been sold to ${transaction.buyer.name || transaction.buyer.email}`,
            relatedEntity: {
              entityType: 'order',
              entityId: transaction._id
            }
          });
          console.log('Notification created for seller about completed sale');
        }
        
        // Create notification for buyer about confirmed purchase
        if (transaction.buyer) {
          await Notification.createNotification({
            user: transaction.buyer._id,
            type: 'order_shipped',
            title: 'Order Confirmed',
            message: `Your purchase of ${transaction.watch.brand} ${transaction.watch.model} has been confirmed`,
            relatedEntity: {
              entityType: 'order',
              entityId: transaction._id
            }
          });
          console.log('Notification created for buyer about confirmed purchase');
        }
      }
    }
    
    // If transaction is cancelled, mark the watch back as active
    if (status === 'cancel') {
      const transaction = await Transaction.findOne({ applicationTransactionId: transactionId });
      if (transaction && transaction.watch) {
        await Watch.findByIdAndUpdate(transaction.watch, { 
          status: 'active',
          updated_at: new Date()
        });
        console.log(`Watch ${transaction.watch} marked as active after cancellation`);
      }
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('Update transaction error:', error);
    
    if (error.message === 'USER_REAUTH_REQUIRED') {
      return res.status(401).json({ 
        success: false, 
        error: 'Re-authentication required',
        reauth: true 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Failed to update transaction' 
    });
  }
});

// Get a specific order/transaction details
router.get('/orders/:transactionId', requireAuth, async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    // Find transaction in local database
    const transaction = await Transaction.findOne({
      $or: [
        { applicationTransactionId: transactionId },
        { _id: transactionId }
      ],
      buyer: req.user._id // Ensure user can only see their own orders
    })
    .populate('watch', 'brand model reference_number imageUrl price condition year currency')
    .populate('seller', 'name email company_name')
    .populate('buyer', 'name email company_name');
    
    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found' 
      });
    }
    
    // Get latest status from JunoPay
    try {
      const junoPayDetails = await junopayService.getTransactionDetails(
        req.user, 
        transaction.applicationTransactionId
      );
      
      // Extract status from JunoPay response
      let currentStatus = transaction.status; // Default to stored status
      
      if (junoPayDetails) {
        // Check different possible locations for status
        currentStatus = junoPayDetails.status || 
                      junoPayDetails.transactionStatus || 
                      junoPayDetails.transaction?.status ||
                      junoPayDetails.data?.status ||
                      transaction.status;
        
        console.log(`Order details - Transaction ${transaction.applicationTransactionId} - JunoPay status: ${currentStatus}`);
      }
      
      const orderDetails = {
        ...transaction.toObject(),
        currentStatus: currentStatus,
        junoPayDetails: junoPayDetails,
        timeline: [
          {
            status: 'initiated',
            date: transaction.created_at,
            description: 'Order placed'
          },
          ...(junoPayDetails?.statusHistory || [])
        ]
      };
      
      res.json({ 
        success: true, 
        order: orderDetails 
      });
    } catch (junoError) {
      console.error('Failed to get JunoPay details:', junoError);
      // Return transaction even if JunoPay call fails
      res.json({ 
        success: true, 
        order: {
          ...transaction.toObject(),
          currentStatus: transaction.status,
          timeline: [
            {
              status: 'initiated',
              date: transaction.created_at,
              description: 'Order placed'
            }
          ]
        }
      });
    }
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve order details' 
    });
  }
});

// Get user's sales history (transactions where they are the seller)
router.get('/sales', requireAuth, async (req, res) => {
  try {
    // Get transactions from local database where user is the seller
    const transactions = await Transaction.find({ 
      seller: req.user._id 
    })
    .populate('watch', 'brand model reference_number imageUrl price condition year currency')
    .populate('buyer', 'name email company_name')
    .populate('seller', 'name email company_name')
    .sort({ created_at: -1 });

    // For each transaction, get current status from JunoPay
    const salesWithStatus = await Promise.all(
      transactions.map(async (transaction) => {
        try {
          // Get current status from JunoPay API
          const junoPayDetails = await junopayService.getTransactionDetails(
            req.user, 
            transaction.applicationTransactionId
          );
          
          // Extract status from JunoPay response
          let currentStatus = transaction.status; // Default to stored status
          
          if (junoPayDetails) {
            console.log(`Sales - JunoPay response for ${transaction.applicationTransactionId}:`, JSON.stringify(junoPayDetails, null, 2));
            
            // Check different possible locations for status
            currentStatus = junoPayDetails.status || 
                          junoPayDetails.transactionStatus || 
                          junoPayDetails.transaction?.status ||
                          junoPayDetails.data?.status ||
                          transaction.status;
            
            console.log(`Sales - Transaction ${transaction.applicationTransactionId} - JunoPay status: ${currentStatus}`);
            
            // Update the stored status if it's different
            if (currentStatus !== transaction.status && currentStatus !== 'initiated') {
              // Update transaction status
              Transaction.findByIdAndUpdate(transaction._id, { 
                status: currentStatus,
                updated_at: new Date()
              }).catch(err => console.error('Failed to update transaction status:', err));
              
              // Also update watch status if transaction is confirmed
              if (currentStatus === 'confirmed' && transaction.watch) {
                Watch.findByIdAndUpdate(transaction.watch, {
                  status: 'sold',
                  updated_at: new Date()
                }).then(() => {
                  console.log(`Watch ${transaction.watch} marked as sold (order status sync)`);
                }).catch(err => console.error('Failed to update watch status:', err));
              }
            }
          }
          
          return {
            ...transaction.toObject(),
            currentStatus: currentStatus,
            junoPayDetails: junoPayDetails
          };
        } catch (error) {
          console.error(`Failed to get JunoPay status for sale ${transaction.applicationTransactionId}:`, error);
          // Return the transaction with stored status if JunoPay call fails
          return {
            ...transaction.toObject(),
            currentStatus: transaction.status,
            junoPayDetails: null
          };
        }
      })
    );

    res.json({ 
      success: true, 
      sales: salesWithStatus 
    });
  } catch (error) {
    console.error('Get sales history error:', error);
    
    if (error.message === 'USER_REAUTH_REQUIRED') {
      return res.status(401).json({ 
        success: false, 
        error: 'Re-authentication required',
        reauth: true 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve sales history' 
    });
  }
});

// Get user's order history (all transactions)
router.get('/orders', requireAuth, async (req, res) => {
  try {
    // Get transactions from local database
    const transactions = await Transaction.find({ 
      buyer: req.user._id 
    })
    .populate('watch', 'brand model reference_number imageUrl currency price')
    .populate('seller', 'name email company_name')
    .sort({ created_at: -1 });

    // For each transaction, get current status from JunoPay
    const ordersWithStatus = await Promise.all(
      transactions.map(async (transaction) => {
        try {
          // Get current status from JunoPay API
          const junoPayDetails = await junopayService.getTransactionDetails(
            req.user, 
            transaction.applicationTransactionId
          );
          
          // Extract status from JunoPay response
          // The status might be in different places depending on the API response structure
          let currentStatus = transaction.status; // Default to stored status
          
          if (junoPayDetails) {
            // Log the full response to understand the structure
            console.log(`JunoPay response for ${transaction.applicationTransactionId}:`, JSON.stringify(junoPayDetails, null, 2));
            
            // Check different possible locations for status
            currentStatus = junoPayDetails.status || 
                          junoPayDetails.transactionStatus || 
                          junoPayDetails.transaction?.status ||
                          junoPayDetails.data?.status ||
                          transaction.status;
            
            console.log(`Transaction ${transaction.applicationTransactionId} - JunoPay status: ${currentStatus}`);
            
            // Update the stored status if it's different
            if (currentStatus !== transaction.status && currentStatus !== 'initiated') {
              // Update transaction status
              Transaction.findByIdAndUpdate(transaction._id, { 
                status: currentStatus,
                updated_at: new Date()
              }).catch(err => console.error('Failed to update transaction status:', err));
              
              // Also update watch status if transaction is confirmed
              if (currentStatus === 'confirmed' && transaction.watch) {
                Watch.findByIdAndUpdate(transaction.watch, {
                  status: 'sold',
                  updated_at: new Date()
                }).then(() => {
                  console.log(`Watch ${transaction.watch} marked as sold (order status sync)`);
                }).catch(err => console.error('Failed to update watch status:', err));
              }
            }
          }
          
          return {
            ...transaction.toObject(),
            currentStatus: currentStatus,
            junoPayDetails: junoPayDetails
          };
        } catch (error) {
          console.error(`Failed to get JunoPay status for ${transaction.applicationTransactionId}:`, error);
          // Return the transaction with stored status if JunoPay call fails
          return {
            ...transaction.toObject(),
            currentStatus: transaction.status,
            junoPayDetails: null
          };
        }
      })
    );

    res.json({ 
      success: true, 
      orders: ordersWithStatus 
    });
  } catch (error) {
    console.error('Get order history error:', error);
    
    if (error.message === 'USER_REAUTH_REQUIRED') {
      return res.status(401).json({ 
        success: false, 
        error: 'Re-authentication required',
        reauth: true 
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve order history' 
    });
  }
});

export default router;