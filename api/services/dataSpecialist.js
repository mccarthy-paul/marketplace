/**
 * Data Specialist Sub-Agent for Juno Marketplace
 * Handles all database queries and data analysis operations
 */

import mongoose from 'mongoose';
import Watch from '../db/watchModel.js';
import User from '../db/userModel.js';
import Bid from '../db/bidModel.js';
import Transaction from '../db/transactionModel.js';
import Cart from '../db/cartModel.js';

class DataSpecialist {
  constructor() {
    this.models = {
      watch: Watch,
      user: User,
      bid: Bid,
      transaction: Transaction,
      cart: Cart
    };
  }

  /**
   * Execute a query based on natural language or structured input
   * @param {Object} queryRequest - The query request object
   * @returns {Promise<Object>} Query results
   */
  async executeQuery(queryRequest) {
    const { type, entity, filters = {}, aggregation = null, projection = null, sort = {}, limit = null, skip = 0 } = queryRequest;

    try {
      switch (type) {
        case 'find':
          return await this.findDocuments(entity, filters, projection, sort, limit, skip);
        case 'aggregate':
          return await this.aggregateData(entity, aggregation);
        case 'stats':
          return await this.getStatistics(entity, filters);
        case 'search':
          return await this.searchDocuments(entity, queryRequest.searchTerm, filters);
        case 'insights':
          return await this.getInsights(entity, filters);
        default:
          throw new Error(`Unknown query type: ${type}`);
      }
    } catch (error) {
      console.error('DataSpecialist query error:', error);
      throw error;
    }
  }

  /**
   * Find documents with flexible filtering
   */
  async findDocuments(entity, filters, projection, sort, limit, skip) {
    const Model = this.models[entity.toLowerCase()];
    if (!Model) throw new Error(`Unknown entity: ${entity}`);

    let query = Model.find(filters);
    
    if (projection) query = query.select(projection);
    if (sort && Object.keys(sort).length > 0) query = query.sort(sort);
    if (skip) query = query.skip(skip);
    if (limit) query = query.limit(limit);

    // Populate related data based on entity type
    if (entity === 'bid') {
      query = query.populate('watch').populate('bidder');
    } else if (entity === 'transaction') {
      query = query.populate('watch').populate('buyer').populate('seller');
    } else if (entity === 'cart') {
      query = query.populate('user').populate('items.watch');
    }

    const results = await query.exec();
    const count = await Model.countDocuments(filters);

    return {
      entity,
      results,
      count,
      hasMore: limit ? (skip + results.length) < count : false
    };
  }

  /**
   * Perform aggregation queries
   */
  async aggregateData(entity, pipeline) {
    const Model = this.models[entity.toLowerCase()];
    if (!Model) throw new Error(`Unknown entity: ${entity}`);

    const results = await Model.aggregate(pipeline);
    return {
      entity,
      aggregation: true,
      results
    };
  }

  /**
   * Get statistics for an entity
   */
  async getStatistics(entity, filters = {}) {
    const Model = this.models[entity.toLowerCase()];
    if (!Model) throw new Error(`Unknown entity: ${entity}`);

    const stats = {
      entity,
      totalCount: await Model.countDocuments(filters)
    };

    // Entity-specific statistics
    switch (entity.toLowerCase()) {
      case 'watch':
        stats.byStatus = await this.getWatchStatsByStatus(filters);
        stats.byBrand = await this.getWatchStatsByBrand(filters);
        stats.priceRange = await this.getWatchPriceRange(filters);
        stats.averagePrice = await this.getWatchAveragePrice(filters);
        break;

      case 'bid':
        stats.byStatus = await this.getBidStatsByStatus(filters);
        stats.totalValue = await this.getTotalBidValue(filters);
        stats.averageBid = await this.getAverageBidAmount(filters);
        stats.topBidders = await this.getTopBidders(filters, 5);
        break;

      case 'transaction':
        stats.byStatus = await this.getTransactionStatsByStatus(filters);
        stats.totalRevenue = await this.getTotalRevenue(filters);
        stats.averageOrderValue = await this.getAverageOrderValue(filters);
        stats.recentTransactions = await this.getRecentTransactions(filters, 10);
        break;

      case 'user':
        stats.byRole = await this.getUserStatsByRole(filters);
        stats.activeUsers = await this.getActiveUsers(filters);
        stats.topBuyers = await this.getTopBuyers(filters, 5);
        break;
    }

    return stats;
  }

  /**
   * Search documents with text search
   */
  async searchDocuments(entity, searchTerm, additionalFilters = {}) {
    const Model = this.models[entity.toLowerCase()];
    if (!Model) throw new Error(`Unknown entity: ${entity}`);

    let searchQuery = {};

    // Build text search query based on entity
    switch (entity.toLowerCase()) {
      case 'watch':
        searchQuery = {
          $or: [
            { brand: { $regex: searchTerm, $options: 'i' } },
            { model: { $regex: searchTerm, $options: 'i' } },
            { reference_number: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } }
          ]
        };
        break;

      case 'user':
        searchQuery = {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
          ]
        };
        break;

      case 'bid':
        searchQuery = {
          $or: [
            { bidderEmail: { $regex: searchTerm, $options: 'i' } },
            { ownerEmail: { $regex: searchTerm, $options: 'i' } },
            { bidderName: { $regex: searchTerm, $options: 'i' } }
          ]
        };
        break;
    }

    // Merge with additional filters
    const finalQuery = { ...searchQuery, ...additionalFilters };

    let query = Model.find(finalQuery).limit(50);

    // Populate related data
    if (entity === 'bid') {
      query = query.populate('watch').populate('bidder');
    } else if (entity === 'transaction') {
      query = query.populate('watch').populate('buyer').populate('seller');
    }

    const results = await query.exec();

    return {
      entity,
      searchTerm,
      results,
      count: results.length
    };
  }

  /**
   * Get business insights
   */
  async getInsights(entity, filters = {}) {
    const insights = {
      entity,
      timestamp: new Date()
    };

    switch (entity.toLowerCase()) {
      case 'marketplace':
        insights.overview = await this.getMarketplaceOverview();
        insights.trends = await this.getMarketplaceTrends();
        insights.recommendations = await this.getMarketplaceRecommendations();
        break;

      case 'watch':
        insights.popularBrands = await this.getPopularBrands();
        insights.priceDistribution = await this.getPriceDistribution();
        insights.demandAnalysis = await this.getDemandAnalysis();
        break;

      case 'user':
        insights.userActivity = await this.getUserActivityInsights();
        insights.userSegments = await this.getUserSegments();
        break;

      case 'sales':
        insights.salesPerformance = await this.getSalesPerformance();
        insights.revenueAnalysis = await this.getRevenueAnalysis();
        break;
    }

    return insights;
  }

  // Helper methods for Watch statistics
  async getWatchStatsByStatus(filters) {
    return await Watch.aggregate([
      { $match: filters },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
  }

  async getWatchStatsByBrand(filters) {
    return await Watch.aggregate([
      { $match: filters },
      { $group: { _id: '$brand', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
  }

  async getWatchPriceRange(filters) {
    const result = await Watch.aggregate([
      { $match: filters },
      { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
    ]);
    return result[0] || { min: 0, max: 0 };
  }

  async getWatchAveragePrice(filters) {
    const result = await Watch.aggregate([
      { $match: filters },
      { $group: { _id: null, avg: { $avg: '$price' } } }
    ]);
    return result[0]?.avg || 0;
  }

  // Helper methods for Bid statistics
  async getBidStatsByStatus(filters) {
    return await Bid.aggregate([
      { $match: filters },
      { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$amount' } } }
    ]);
  }

  async getTotalBidValue(filters) {
    const result = await Bid.aggregate([
      { $match: filters },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    return result[0]?.total || 0;
  }

  async getAverageBidAmount(filters) {
    const result = await Bid.aggregate([
      { $match: filters },
      { $group: { _id: null, avg: { $avg: '$amount' } } }
    ]);
    return result[0]?.avg || 0;
  }

  async getTopBidders(filters, limit = 5) {
    return await Bid.aggregate([
      { $match: filters },
      { $group: { 
        _id: '$bidderEmail', 
        name: { $first: '$bidderName' },
        totalBids: { $sum: 1 }, 
        totalValue: { $sum: '$amount' } 
      }},
      { $sort: { totalValue: -1 } },
      { $limit: limit }
    ]);
  }

  // Helper methods for Transaction statistics
  async getTransactionStatsByStatus(filters) {
    return await Transaction.aggregate([
      { $match: filters },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
  }

  async getTotalRevenue(filters) {
    const result = await Transaction.aggregate([
      { $match: { ...filters, status: 'completed' } },
      { $group: { _id: null, total: { $sum: { $toDouble: '$totalPrice' } } } }
    ]);
    return result[0]?.total || 0;
  }

  async getAverageOrderValue(filters) {
    const result = await Transaction.aggregate([
      { $match: { ...filters, status: 'completed' } },
      { $group: { _id: null, avg: { $avg: { $toDouble: '$totalPrice' } } } }
    ]);
    return result[0]?.avg || 0;
  }

  async getRecentTransactions(filters, limit = 10) {
    return await Transaction.find(filters)
      .sort({ created_at: -1 })
      .limit(limit)
      .populate('watch')
      .populate('buyer');
  }

  // Helper methods for User statistics
  async getUserStatsByRole(filters) {
    return await User.aggregate([
      { $match: filters },
      { $group: { _id: '$is_admin', count: { $sum: 1 } } },
      { $project: { role: { $cond: ['$_id', 'admin', 'customer'] }, count: 1 } }
    ]);
  }

  async getActiveUsers(filters) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return await User.countDocuments({
      ...filters,
      last_login: { $gte: thirtyDaysAgo }
    });
  }

  async getTopBuyers(filters, limit = 5) {
    return await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: {
        _id: '$buyer',
        totalPurchases: { $sum: 1 },
        totalSpent: { $sum: { $toDouble: '$totalPrice' } }
      }},
      { $sort: { totalSpent: -1 } },
      { $limit: limit },
      { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'userInfo'
      }},
      { $unwind: '$userInfo' },
      { $project: {
        name: '$userInfo.name',
        email: '$userInfo.email',
        totalPurchases: 1,
        totalSpent: 1
      }}
    ]);
  }

  // Marketplace insights
  async getMarketplaceOverview() {
    const [watches, users, bids, transactions] = await Promise.all([
      Watch.countDocuments(),
      User.countDocuments(),
      Bid.countDocuments(),
      Transaction.countDocuments()
    ]);

    const revenue = await this.getTotalRevenue({});
    const avgOrderValue = await this.getAverageOrderValue({});

    return {
      totalWatches: watches,
      totalUsers: users,
      totalBids: bids,
      totalTransactions: transactions,
      totalRevenue: revenue,
      averageOrderValue: avgOrderValue
    };
  }

  async getMarketplaceTrends() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTransactions = await Transaction.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
        count: { $sum: 1 },
        revenue: { $sum: { $toDouble: '$totalPrice' } }
      }},
      { $sort: { _id: 1 } }
    ]);

    const dailyBids = await Bid.aggregate([
      { $match: { created_at: { $gte: thirtyDaysAgo } } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
        count: { $sum: 1 },
        totalValue: { $sum: '$amount' }
      }},
      { $sort: { _id: 1 } }
    ]);

    return {
      dailyTransactions,
      dailyBids
    };
  }

  async getMarketplaceRecommendations() {
    const recommendations = [];

    // Check for watches without images
    const watchesWithoutImages = await Watch.countDocuments({ 
      $or: [{ images: { $exists: false } }, { images: { $size: 0 } }] 
    });
    if (watchesWithoutImages > 0) {
      recommendations.push({
        type: 'warning',
        message: `${watchesWithoutImages} watches need images uploaded`
      });
    }

    // Check for pending bids
    const pendingBids = await Bid.countDocuments({ status: 'offered' });
    if (pendingBids > 10) {
      recommendations.push({
        type: 'action',
        message: `${pendingBids} bids are awaiting response`
      });
    }

    // Check for low inventory brands
    const brandInventory = await Watch.aggregate([
      { $match: { status: 'available' } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $match: { count: { $lte: 2 } } }
    ]);
    if (brandInventory.length > 0) {
      recommendations.push({
        type: 'inventory',
        message: `${brandInventory.length} brands have low inventory`
      });
    }

    return recommendations;
  }

  async getPopularBrands() {
    return await Watch.aggregate([
      { $group: {
        _id: '$brand',
        totalWatches: { $sum: 1 },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }},
      { $sort: { totalWatches: -1 } },
      { $limit: 10 }
    ]);
  }

  async getPriceDistribution() {
    return await Watch.aggregate([
      { $bucket: {
        groupBy: '$price',
        boundaries: [0, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          watches: { $push: { brand: '$brand', model: '$model', price: '$price' } }
        }
      }}
    ]);
  }

  async getDemandAnalysis() {
    const mostBidded = await Bid.aggregate([
      { $group: {
        _id: '$watch',
        bidCount: { $sum: 1 },
        avgBidAmount: { $avg: '$amount' },
        maxBid: { $max: '$amount' }
      }},
      { $sort: { bidCount: -1 } },
      { $limit: 10 },
      { $lookup: {
        from: 'watches',
        localField: '_id',
        foreignField: '_id',
        as: 'watchDetails'
      }},
      { $unwind: '$watchDetails' }
    ]);

    return {
      mostBiddedWatches: mostBidded
    };
  }

  async getUserActivityInsights() {
    const activeUsers = await this.getActiveUsers({});
    const usersByMonth = await User.aggregate([
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
        newUsers: { $sum: 1 }
      }},
      { $sort: { _id: -1 } },
      { $limit: 12 }
    ]);

    return {
      activeUsersLast30Days: activeUsers,
      userGrowth: usersByMonth
    };
  }

  async getUserSegments() {
    const segments = await User.aggregate([
      { $lookup: {
        from: 'transactions',
        localField: '_id',
        foreignField: 'buyer',
        as: 'purchases'
      }},
      { $addFields: { purchaseCount: { $size: '$purchases' } } },
      { $bucket: {
        groupBy: '$purchaseCount',
        boundaries: [0, 1, 2, 5, 10, 20],
        default: 'Power Users',
        output: {
          users: { $sum: 1 },
          avgPurchases: { $avg: '$purchaseCount' }
        }
      }}
    ]);

    return segments;
  }

  async getSalesPerformance() {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const lastMonth = new Date(currentMonth);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const [currentMonthSales, lastMonthSales] = await Promise.all([
      Transaction.aggregate([
        { $match: { created_at: { $gte: currentMonth }, status: 'completed' } },
        { $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: { $toDouble: '$totalPrice' } }
        }}
      ]),
      Transaction.aggregate([
        { $match: { 
          created_at: { $gte: lastMonth, $lt: currentMonth }, 
          status: 'completed' 
        }},
        { $group: {
          _id: null,
          count: { $sum: 1 },
          revenue: { $sum: { $toDouble: '$totalPrice' } }
        }}
      ])
    ]);

    const current = currentMonthSales[0] || { count: 0, revenue: 0 };
    const previous = lastMonthSales[0] || { count: 0, revenue: 0 };

    return {
      currentMonth: current,
      lastMonth: previous,
      growth: {
        transactions: previous.count ? ((current.count - previous.count) / previous.count * 100) : 0,
        revenue: previous.revenue ? ((current.revenue - previous.revenue) / previous.revenue * 100) : 0
      }
    };
  }

  async getRevenueAnalysis() {
    const revenueByCategory = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $lookup: {
        from: 'watches',
        localField: 'watch',
        foreignField: '_id',
        as: 'watchInfo'
      }},
      { $unwind: '$watchInfo' },
      { $group: {
        _id: '$watchInfo.brand',
        revenue: { $sum: { $toDouble: '$totalPrice' } },
        transactions: { $sum: 1 },
        avgTransactionValue: { $avg: { $toDouble: '$totalPrice' } }
      }},
      { $sort: { revenue: -1 } }
    ]);

    return {
      byBrand: revenueByCategory
    };
  }

  /**
   * Parse natural language queries into structured queries
   */
  parseNaturalQuery(naturalQuery) {
    const query = naturalQuery.toLowerCase();
    
    // Detect entity
    let entity = 'watch'; // default
    if (query.includes('user') || query.includes('customer')) entity = 'user';
    else if (query.includes('bid')) entity = 'bid';
    else if (query.includes('order') || query.includes('transaction')) entity = 'transaction';
    else if (query.includes('cart')) entity = 'cart';

    // Detect query type
    let type = 'find'; // default
    if (query.includes('stat') || query.includes('metric')) type = 'stats';
    else if (query.includes('search')) type = 'search';
    else if (query.includes('insight') || query.includes('analysis')) type = 'insights';
    else if (query.includes('aggregate') || query.includes('group')) type = 'aggregate';

    // Extract filters
    const filters = {};
    
    // Status filters
    if (query.includes('available')) filters.status = 'available';
    else if (query.includes('sold')) filters.status = 'sold';
    else if (query.includes('pending')) filters.status = 'pending';
    else if (query.includes('accepted')) filters.status = 'accepted';
    else if (query.includes('rejected')) filters.status = 'rejected';
    else if (query.includes('completed')) filters.status = 'completed';

    // Price filters
    const priceMatch = query.match(/(?:under|below|less than|<)\s*\$?(\d+)/);
    if (priceMatch) {
      filters.price = { $lt: parseInt(priceMatch[1]) };
    }
    const priceAboveMatch = query.match(/(?:over|above|more than|>)\s*\$?(\d+)/);
    if (priceAboveMatch) {
      filters.price = { $gt: parseInt(priceAboveMatch[1]) };
    }

    // Brand filters
    const brands = ['rolex', 'patek philippe', 'omega', 'cartier', 'audemars piguet', 'breitling'];
    for (const brand of brands) {
      if (query.includes(brand)) {
        filters.brand = new RegExp(brand, 'i');
        break;
      }
    }

    // Time filters
    if (query.includes('today')) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filters.created_at = { $gte: today };
    } else if (query.includes('this week')) {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      filters.created_at = { $gte: weekAgo };
    } else if (query.includes('this month')) {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      filters.created_at = { $gte: monthAgo };
    }

    // Sort options
    let sort = {};
    if (query.includes('newest') || query.includes('recent')) {
      sort = { created_at: -1 };
    } else if (query.includes('oldest')) {
      sort = { created_at: 1 };
    } else if (query.includes('expensive') || query.includes('highest price')) {
      sort = { price: -1 };
    } else if (query.includes('cheapest') || query.includes('lowest price')) {
      sort = { price: 1 };
    }

    // Limit
    let limit = null;
    const limitMatch = query.match(/(?:top|first|limit)\s*(\d+)/);
    if (limitMatch) {
      limit = parseInt(limitMatch[1]);
    }

    return {
      type,
      entity,
      filters,
      sort,
      limit
    };
  }
}

export default DataSpecialist;