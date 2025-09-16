import express from 'express';
import mongoose from 'mongoose';
import Bid from '../db/bidModel.js';
import Transaction from '../db/transactionModel.js';
import Order from '../db/orderModel.js';

const router = express.Router();

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
}

// Get daily bids received for the current user
router.get('/daily-bids', isAuthenticated, async (req, res) => {
  try {
    const userId = mongoose.Types.ObjectId.createFromHexString(req.session.user._id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get all watches owned by the user
    const Watch = (await import('../db/watchModel.js')).default;
    const userWatches = await Watch.find({ owner: userId }).select('_id');
    const watchIds = userWatches.map(w => w._id);
    
    if (watchIds.length === 0) {
      return res.json({ dailyBids: [] });
    }
    
    // Aggregate bids by day for the user's watches
    const dailyBids = await Bid.aggregate([
      {
        $match: {
          watch: { $in: watchIds },
          created_at: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
          },
          count: { $sum: 1 },
          totalValue: { $sum: "$amount" }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          totalValue: 1,
          _id: 0
        }
      }
    ]);
    
    // Fill in missing dates with zero values
    const allDates = [];
    for (let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
      allDates.push(new Date(d).toISOString().split('T')[0]);
    }
    
    const bidsByDate = {};
    dailyBids.forEach(item => {
      bidsByDate[item.date] = item;
    });
    
    const filledData = allDates.map(date => ({
      date,
      count: bidsByDate[date]?.count || 0,
      totalValue: bidsByDate[date]?.totalValue || 0
    }));
    
    res.json({ dailyBids: filledData });
  } catch (error) {
    console.error('Error fetching daily bids:', error);
    res.status(500).json({ error: 'Failed to fetch daily bids data' });
  }
});

// Get daily sales for the current user
router.get('/daily-sales', isAuthenticated, async (req, res) => {
  try {
    const userId = mongoose.Types.ObjectId.createFromHexString(req.session.user._id);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Aggregate orders/transactions by day where user is the seller
    const dailySales = await Order.aggregate([
      {
        $match: {
          seller: userId,
          status: { $in: ['completed', 'shipped', 'delivered'] },
          created_at: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
          },
          count: { $sum: 1 },
          totalValue: { $sum: { $toDouble: "$purchasePrice" } }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          totalValue: 1,
          _id: 0
        }
      }
    ]);
    
    // Also check transactions collection for JunoPay transactions
    const dailyTransactions = await Transaction.aggregate([
      {
        $match: {
          seller: userId,
          status: { $in: ['completed', 'confirmed'] },
          created_at: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
          },
          count: { $sum: 1 },
          totalValue: { $sum: { $toDouble: "$purchasePrice" } }
        }
      },
      {
        $sort: { _id: 1 }
      },
      {
        $project: {
          date: "$_id",
          count: 1,
          totalValue: 1,
          _id: 0
        }
      }
    ]);
    
    // Merge sales from both collections
    const salesByDate = {};
    [...dailySales, ...dailyTransactions].forEach(item => {
      if (salesByDate[item.date]) {
        salesByDate[item.date].count += item.count;
        salesByDate[item.date].totalValue += item.totalValue;
      } else {
        salesByDate[item.date] = item;
      }
    });
    
    // Fill in missing dates with zero values
    const allDates = [];
    for (let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
      allDates.push(new Date(d).toISOString().split('T')[0]);
    }
    
    const filledData = allDates.map(date => ({
      date,
      count: salesByDate[date]?.count || 0,
      totalValue: salesByDate[date]?.totalValue || 0
    }));
    
    res.json({ dailySales: filledData });
  } catch (error) {
    console.error('Error fetching daily sales:', error);
    res.status(500).json({ error: 'Failed to fetch daily sales data' });
  }
});

// Get summary statistics
router.get('/summary', isAuthenticated, async (req, res) => {
  try {
    const userId = mongoose.Types.ObjectId.createFromHexString(req.session.user._id);
    
    // Get all watches owned by the user
    const Watch = (await import('../db/watchModel.js')).default;
    const userWatches = await Watch.find({ owner: userId }).select('_id');
    const watchIds = userWatches.map(w => w._id);
    
    // Count total bids received
    const totalBidsReceived = await Bid.countDocuments({ 
      watch: { $in: watchIds } 
    });
    
    // Count pending bids
    const pendingBids = await Bid.countDocuments({ 
      watch: { $in: watchIds },
      status: 'offered'
    });
    
    // Count total sales
    const completedOrders = await Order.countDocuments({
      seller: userId,
      status: { $in: ['completed', 'shipped', 'delivered'] }
    });
    
    const completedTransactions = await Transaction.countDocuments({
      seller: userId,
      status: { $in: ['completed', 'confirmed'] }
    });
    
    const totalSales = completedOrders + completedTransactions;
    
    // Calculate total revenue
    const orderRevenue = await Order.aggregate([
      {
        $match: {
          seller: userId,
          status: { $in: ['completed', 'shipped', 'delivered'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$purchasePrice" } }
        }
      }
    ]);
    
    const transactionRevenue = await Transaction.aggregate([
      {
        $match: {
          seller: userId,
          status: { $in: ['completed', 'confirmed'] }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $toDouble: "$purchasePrice" } }
        }
      }
    ]);
    
    const totalRevenue = 
      (orderRevenue[0]?.total || 0) + 
      (transactionRevenue[0]?.total || 0);
    
    res.json({
      totalBidsReceived,
      pendingBids,
      totalSales,
      totalRevenue
    });
  } catch (error) {
    console.error('Error fetching summary statistics:', error);
    res.status(500).json({ error: 'Failed to fetch summary statistics' });
  }
});

export default router;