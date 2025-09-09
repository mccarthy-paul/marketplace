import express from 'express';
import User from '../db/userModel.js';
import Watch from '../db/watchModel.js';
import Transaction from '../db/transactionModel.js';
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

    if (!['confirm', 'query'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be either "confirm" or "query"'
      });
    }

    const result = await junopayService.updateTransaction(req.user, transactionId, status, note);
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

// Get user's order history (all transactions)
router.get('/orders', requireAuth, async (req, res) => {
  try {
    // Get transactions from local database
    const transactions = await Transaction.find({ 
      buyer: req.user._id 
    })
    .populate('watch', 'brand model reference_number imageUrl')
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
          
          return {
            ...transaction.toObject(),
            currentStatus: junoPayDetails.status || transaction.status,
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