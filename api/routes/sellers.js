import express from 'express';
import mongoose from 'mongoose';
import User from '../db/userModel.js';
import Transaction from '../db/transactionModel.js';
import Review from '../db/reviewModel.js';
import Watch from '../db/watchModel.js';

const router = express.Router();

// Get seller profile with statistics
router.get('/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Get seller information
    const seller = await User.findById(sellerId).select('-access_token -refresh_token -password');

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Get seller's completed transactions count
    const completedSales = await Transaction.countDocuments({
      seller: sellerId,
      status: { $in: ['completed', 'confirmed'] }
    });

    // Get seller's active listings
    const activeListings = await Watch.countDocuments({
      owner: sellerId,
      status: { $in: ['available', 'pending'] }
    });

    // Get reviews for this seller
    const reviews = await Review.find({ seller: sellerId })
      .populate('buyer', 'name company_name')
      .populate('watch', 'brand model reference_number')
      .sort({ created_at: -1 })
      .limit(10);

    // Calculate average ratings
    const reviewStats = await Review.aggregate([
      { $match: { seller: mongoose.Types.ObjectId.createFromHexString(sellerId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          avgCommunication: { $avg: '$aspects.communication' },
          avgShipping: { $avg: '$aspects.shipping' },
          avgAccuracy: { $avg: '$aspects.accuracy' },
          avgPackaging: { $avg: '$aspects.packaging' },
          ratingBreakdown: {
            $push: '$rating'
          }
        }
      }
    ]);

    // Calculate rating distribution
    let ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    if (reviewStats.length > 0 && reviewStats[0].ratingBreakdown) {
      reviewStats[0].ratingBreakdown.forEach(rating => {
        ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
      });
    }

    // Get recent sales (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSales = await Transaction.countDocuments({
      seller: sellerId,
      status: { $in: ['completed', 'confirmed'] },
      created_at: { $gte: thirtyDaysAgo }
    });

    // Build response
    const sellerProfile = {
      id: seller._id,
      name: seller.name,
      email: seller.email,
      company_name: seller.company_name,
      memberSince: seller.created_at,
      isAdmin: seller.is_admin,
      profile: seller.sellerProfile || {},
      statistics: {
        totalSales: completedSales,
        activeListings,
        recentSales,
        averageRating: reviewStats[0]?.averageRating || 0,
        totalReviews: reviewStats[0]?.totalReviews || 0,
        ratingDistribution,
        aspectRatings: {
          communication: reviewStats[0]?.avgCommunication || 0,
          shipping: reviewStats[0]?.avgShipping || 0,
          accuracy: reviewStats[0]?.avgAccuracy || 0,
          packaging: reviewStats[0]?.avgPackaging || 0
        }
      },
      recentReviews: reviews,
      badges: generateBadges(completedSales, reviewStats[0])
    };

    res.json(sellerProfile);
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({ error: 'Failed to fetch seller profile' });
  }
});

// Get seller's current listings
router.get('/:sellerId/watches', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status = 'available' } = req.query;

    const watches = await Watch.find({
      owner: sellerId,
      status: status
    })
    .sort({ created_at: -1 })
    .limit(20);

    res.json(watches);
  } catch (error) {
    console.error('Error fetching seller watches:', error);
    res.status(500).json({ error: 'Failed to fetch seller watches' });
  }
});

// Submit a review for a seller
router.post('/:sellerId/reviews', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.session?.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { sellerId } = req.params;
    const buyerId = req.session.user._id;
    const { transactionId, rating, comment, aspects } = req.body;

    // Verify the transaction exists and belongs to this buyer/seller
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (transaction.seller.toString() !== sellerId ||
        transaction.buyer.toString() !== buyerId) {
      return res.status(403).json({ error: 'Invalid transaction for review' });
    }

    // Check if review already exists for this transaction
    const existingReview = await Review.findOne({ transaction: transactionId });
    if (existingReview) {
      return res.status(400).json({ error: 'Review already exists for this transaction' });
    }

    // Create the review
    const review = new Review({
      transaction: transactionId,
      seller: sellerId,
      buyer: buyerId,
      watch: transaction.watch,
      rating,
      comment,
      aspects: aspects || {},
      verified: true
    });

    await review.save();

    // Update seller's cached statistics
    await updateSellerStats(sellerId);

    res.status(201).json({
      message: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Helper function to generate seller badges
function generateBadges(totalSales, reviewStats) {
  const badges = [];

  if (totalSales >= 100) {
    badges.push({ id: '100_sales', name: '100+ Sales', icon: 'trophy' });
  } else if (totalSales >= 50) {
    badges.push({ id: '50_sales', name: '50+ Sales', icon: 'star' });
  } else if (totalSales >= 10) {
    badges.push({ id: '10_sales', name: '10+ Sales', icon: 'badge' });
  }

  if (reviewStats && reviewStats.averageRating >= 4.8 && reviewStats.totalReviews >= 5) {
    badges.push({ id: 'top_rated', name: 'Top Rated Seller', icon: 'crown' });
  }

  if (reviewStats && reviewStats.avgShipping >= 4.5 && reviewStats.totalReviews >= 5) {
    badges.push({ id: 'fast_shipper', name: 'Fast Shipper', icon: 'rocket' });
  }

  return badges;
}

// Helper function to update seller statistics
async function updateSellerStats(sellerId) {
  try {
    const stats = await Review.aggregate([
      { $match: { seller: mongoose.Types.ObjectId.createFromHexString(sellerId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    const totalSales = await Transaction.countDocuments({
      seller: sellerId,
      status: { $in: ['completed', 'confirmed'] }
    });

    await User.findByIdAndUpdate(sellerId, {
      'sellerStats.totalSales': totalSales,
      'sellerStats.averageRating': stats[0]?.averageRating || 0,
      'sellerStats.totalReviews': stats[0]?.totalReviews || 0,
      'sellerStats.lastActive': new Date()
    });
  } catch (error) {
    console.error('Error updating seller stats:', error);
  }
}

export default router;