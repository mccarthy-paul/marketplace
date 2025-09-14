/**
 * Pre-defined query templates for common database operations
 * These templates can be used directly or as a reference for building custom queries
 */

const QueryTemplates = {
  // Watch-related queries
  watches: {
    // Find all available watches
    getAvailable: {
      type: 'find',
      entity: 'watch',
      filters: { status: 'available' },
      sort: { created_at: -1 }
    },

    // Get watches by brand
    getByBrand: (brand) => ({
      type: 'find',
      entity: 'watch',
      filters: { brand: new RegExp(brand, 'i') },
      sort: { price: -1 }
    }),

    // Get watches in price range
    getByPriceRange: (minPrice, maxPrice) => ({
      type: 'find',
      entity: 'watch',
      filters: { 
        price: { $gte: minPrice, $lte: maxPrice },
        status: 'available'
      },
      sort: { price: 1 }
    }),

    // Get luxury watches (>$50,000)
    getLuxury: {
      type: 'find',
      entity: 'watch',
      filters: { price: { $gt: 50000 }, status: 'available' },
      sort: { price: -1 }
    },

    // Get recently added watches
    getRecent: (days = 7) => {
      const date = new Date();
      date.setDate(date.getDate() - days);
      return {
        type: 'find',
        entity: 'watch',
        filters: { created_at: { $gte: date } },
        sort: { created_at: -1 },
        limit: 20
      };
    },

    // Get watches with active bids
    getWithBids: {
      type: 'aggregate',
      entity: 'watch',
      aggregation: [
        { $lookup: {
          from: 'bids',
          localField: '_id',
          foreignField: 'watch',
          as: 'bids'
        }},
        { $match: { 'bids.0': { $exists: true } } },
        { $addFields: {
          bidCount: { $size: '$bids' },
          highestBid: { $max: '$bids.amount' }
        }},
        { $sort: { bidCount: -1 } }
      ]
    },

    // Get watch price statistics by brand
    getPriceStatsByBrand: {
      type: 'aggregate',
      entity: 'watch',
      aggregation: [
        { $group: {
          _id: '$brand',
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          count: { $sum: 1 }
        }},
        { $sort: { avgPrice: -1 } }
      ]
    }
  },

  // Bid-related queries
  bids: {
    // Get pending bids
    getPending: {
      type: 'find',
      entity: 'bid',
      filters: { status: 'offered' },
      sort: { created_at: -1 }
    },

    // Get bids for a specific watch
    getByWatch: (watchId) => ({
      type: 'find',
      entity: 'bid',
      filters: { watch: watchId },
      sort: { amount: -1 }
    }),

    // Get bids by user email
    getByUser: (email) => ({
      type: 'find',
      entity: 'bid',
      filters: { bidderEmail: email },
      sort: { created_at: -1 }
    }),

    // Get accepted bids
    getAccepted: {
      type: 'find',
      entity: 'bid',
      filters: { status: 'accepted' },
      sort: { updated_at: -1 }
    },

    // Get high-value bids (>$10,000)
    getHighValue: {
      type: 'find',
      entity: 'bid',
      filters: { amount: { $gt: 10000 } },
      sort: { amount: -1 }
    },

    // Get bid statistics by status
    getStatsByStatus: {
      type: 'aggregate',
      entity: 'bid',
      aggregation: [
        { $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$amount' },
          avgValue: { $avg: '$amount' }
        }},
        { $sort: { count: -1 } }
      ]
    },

    // Get top bidders
    getTopBidders: {
      type: 'aggregate',
      entity: 'bid',
      aggregation: [
        { $group: {
          _id: '$bidderEmail',
          name: { $first: '$bidderName' },
          bidCount: { $sum: 1 },
          totalBidValue: { $sum: '$amount' },
          avgBidValue: { $avg: '$amount' }
        }},
        { $sort: { totalBidValue: -1 } },
        { $limit: 10 }
      ]
    }
  },

  // Transaction/Order queries
  transactions: {
    // Get completed orders
    getCompleted: {
      type: 'find',
      entity: 'transaction',
      filters: { status: 'completed' },
      sort: { created_at: -1 }
    },

    // Get pending orders
    getPending: {
      type: 'find',
      entity: 'transaction',
      filters: { status: { $in: ['initiated', 'pending'] } },
      sort: { created_at: -1 }
    },

    // Get orders by buyer
    getByBuyer: (buyerId) => ({
      type: 'find',
      entity: 'transaction',
      filters: { buyer: buyerId },
      sort: { created_at: -1 }
    }),

    // Get recent high-value transactions
    getHighValueRecent: {
      type: 'find',
      entity: 'transaction',
      filters: { 
        status: 'completed',
        totalPrice: { $gt: '50000' }
      },
      sort: { created_at: -1 },
      limit: 10
    },

    // Get monthly revenue
    getMonthlyRevenue: {
      type: 'aggregate',
      entity: 'transaction',
      aggregation: [
        { $match: { status: 'completed' } },
        { $group: {
          _id: { 
            year: { $year: '$created_at' },
            month: { $month: '$created_at' }
          },
          revenue: { $sum: { $toDouble: '$totalPrice' } },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: { $toDouble: '$totalPrice' } }
        }},
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ]
    },

    // Get sales by watch brand
    getSalesByBrand: {
      type: 'aggregate',
      entity: 'transaction',
      aggregation: [
        { $match: { status: 'completed' } },
        { $lookup: {
          from: 'watches',
          localField: 'watch',
          foreignField: '_id',
          as: 'watchData'
        }},
        { $unwind: '$watchData' },
        { $group: {
          _id: '$watchData.brand',
          salesCount: { $sum: 1 },
          totalRevenue: { $sum: { $toDouble: '$totalPrice' } },
          avgSalePrice: { $avg: { $toDouble: '$totalPrice' } }
        }},
        { $sort: { totalRevenue: -1 } }
      ]
    }
  },

  // User queries
  users: {
    // Get all active users
    getActive: {
      type: 'find',
      entity: 'user',
      filters: { is_active: { $ne: false } },
      sort: { last_login: -1 }
    },

    // Get admin users
    getAdmins: {
      type: 'find',
      entity: 'user',
      filters: { is_admin: true },
      projection: 'name email created_at last_login'
    },

    // Get new users (last 30 days)
    getNewUsers: {
      type: 'find',
      entity: 'user',
      filters: { 
        created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      },
      sort: { created_at: -1 }
    },

    // Get users with purchases
    getBuyers: {
      type: 'aggregate',
      entity: 'user',
      aggregation: [
        { $lookup: {
          from: 'transactions',
          localField: '_id',
          foreignField: 'buyer',
          as: 'purchases'
        }},
        { $match: { 'purchases.0': { $exists: true } } },
        { $addFields: {
          purchaseCount: { $size: '$purchases' },
          totalSpent: { 
            $sum: {
              $map: {
                input: '$purchases',
                as: 'purchase',
                in: { $toDouble: '$$purchase.totalPrice' }
              }
            }
          }
        }},
        { $sort: { totalSpent: -1 } },
        { $project: {
          name: 1,
          email: 1,
          purchaseCount: 1,
          totalSpent: 1
        }}
      ]
    },

    // Get user engagement metrics
    getEngagementMetrics: {
      type: 'aggregate',
      entity: 'user',
      aggregation: [
        { $facet: {
          totalUsers: [{ $count: 'count' }],
          activeLastWeek: [
            { $match: { 
              last_login: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }},
            { $count: 'count' }
          ],
          activeLastMonth: [
            { $match: { 
              last_login: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
            }},
            { $count: 'count' }
          ],
          withPurchases: [
            { $lookup: {
              from: 'transactions',
              localField: '_id',
              foreignField: 'buyer',
              as: 'purchases'
            }},
            { $match: { 'purchases.0': { $exists: true } } },
            { $count: 'count' }
          ]
        }}
      ]
    }
  },

  // Dashboard and reporting queries
  reports: {
    // Get marketplace overview
    getOverview: {
      type: 'insights',
      entity: 'marketplace'
    },

    // Get daily activity for the last 30 days
    getDailyActivity: {
      type: 'aggregate',
      entity: 'transaction',
      aggregation: [
        { $match: { 
          created_at: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }},
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$created_at' } },
          transactions: { $sum: 1 },
          revenue: { $sum: { $toDouble: '$totalPrice' } }
        }},
        { $sort: { _id: 1 } }
      ]
    },

    // Get inventory summary
    getInventorySummary: {
      type: 'aggregate',
      entity: 'watch',
      aggregation: [
        { $facet: {
          byStatus: [
            { $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalValue: { $sum: '$price' }
            }}
          ],
          byBrand: [
            { $group: {
              _id: '$brand',
              count: { $sum: 1 },
              avgPrice: { $avg: '$price' }
            }},
            { $sort: { count: -1 } },
            { $limit: 5 }
          ],
          priceRanges: [
            { $bucket: {
              groupBy: '$price',
              boundaries: [0, 10000, 25000, 50000, 100000, 1000000],
              default: 'Other',
              output: { count: { $sum: 1 } }
            }}
          ]
        }}
      ]
    },

    // Get conversion funnel
    getConversionFunnel: {
      type: 'aggregate',
      entity: 'bid',
      aggregation: [
        { $facet: {
          totalBids: [{ $count: 'count' }],
          acceptedBids: [
            { $match: { status: 'accepted' } },
            { $count: 'count' }
          ],
          completedSales: [
            { $match: { status: 'accepted' } },
            { $lookup: {
              from: 'transactions',
              localField: 'watch',
              foreignField: 'watch',
              as: 'transactions'
            }},
            { $match: { 'transactions.status': 'completed' } },
            { $count: 'count' }
          ]
        }}
      ]
    }
  },

  // Complex analytical queries
  analytics: {
    // Get customer lifetime value
    getCustomerLifetimeValue: {
      type: 'aggregate',
      entity: 'user',
      aggregation: [
        { $lookup: {
          from: 'transactions',
          localField: '_id',
          foreignField: 'buyer',
          as: 'purchases'
        }},
        { $lookup: {
          from: 'bids',
          localField: 'email',
          foreignField: 'bidderEmail',
          as: 'bids'
        }},
        { $project: {
          name: 1,
          email: 1,
          purchaseCount: { $size: '$purchases' },
          bidCount: { $size: '$bids' },
          totalSpent: {
            $sum: {
              $map: {
                input: { $filter: {
                  input: '$purchases',
                  as: 'p',
                  cond: { $eq: ['$$p.status', 'completed'] }
                }},
                as: 'purchase',
                in: { $toDouble: '$$purchase.totalPrice' }
              }
            }
          },
          avgOrderValue: {
            $avg: {
              $map: {
                input: { $filter: {
                  input: '$purchases',
                  as: 'p',
                  cond: { $eq: ['$$p.status', 'completed'] }
                }},
                as: 'purchase',
                in: { $toDouble: '$$purchase.totalPrice' }
              }
            }
          },
          firstPurchase: { $min: '$purchases.created_at' },
          lastPurchase: { $max: '$purchases.created_at' }
        }},
        { $sort: { totalSpent: -1 } }
      ]
    },

    // Get demand analysis by brand
    getDemandByBrand: {
      type: 'aggregate',
      entity: 'watch',
      aggregation: [
        { $lookup: {
          from: 'bids',
          localField: '_id',
          foreignField: 'watch',
          as: 'bids'
        }},
        { $group: {
          _id: '$brand',
          totalWatches: { $sum: 1 },
          availableWatches: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
          },
          soldWatches: {
            $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] }
          },
          totalBids: { $sum: { $size: '$bids' } },
          avgBidsPerWatch: { $avg: { $size: '$bids' } },
          avgPrice: { $avg: '$price' },
          totalInventoryValue: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, '$price', 0] }
          }
        }},
        { $sort: { totalBids: -1 } }
      ]
    }
  }
};

// Helper function to execute a template
const executeTemplate = async (dataSpecialist, templatePath, ...params) => {
  const pathParts = templatePath.split('.');
  let template = QueryTemplates;
  
  for (const part of pathParts) {
    template = template[part];
    if (!template) {
      throw new Error(`Template not found: ${templatePath}`);
    }
  }
  
  // If template is a function, call it with parameters
  if (typeof template === 'function') {
    template = template(...params);
  }
  
  return await dataSpecialist.executeQuery(template);
};

module.exports = {
  QueryTemplates,
  executeTemplate
};