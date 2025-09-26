import express from 'express';
import { searchWatches, getSuggestions, findSimilarWatches } from '../services/opensearch.js';
import { updateSearchMetrics } from '../services/searchSync.js';
import Redis from 'ioredis';

const router = express.Router();

// Initialize Redis for caching (optional)
let redis;
let redisAvailable = false;

try {
  redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error('Redis connection failed after 3 attempts');
        return null;
      }
      return Math.min(times * 100, 3000);
    },
    lazyConnect: true
  });

  // Test connection
  redis.ping().then(() => {
    redisAvailable = true;
    console.log('✅ Redis cache connected');
  }).catch(() => {
    console.log('⚠️ Redis cache not available, running without cache');
    redisAvailable = false;
  });
} catch (error) {
  console.log('⚠️ Redis initialization failed, running without cache');
  redisAvailable = false;
}

// Cache key generator
function generateCacheKey(type, params) {
  return `search:${type}:${JSON.stringify(params)}`;
}

// Main search endpoint with caching
router.get('/watches', async (req, res) => {
  try {
    const {
      q,                    // Search query
      brand,               // Brand filter
      model,               // Model filter
      minPrice,           // Minimum price
      maxPrice,           // Maximum price
      condition,          // Condition filter (can be array)
      year,               // Year filter
      classifications,    // Classifications filter (comma-separated)
      movement,           // Movement type
      caseMaterial,       // Case material
      dialColor,          // Dial color
      sellerId,           // Seller ID filter
      featured,           // Featured only
      sort = 'relevance', // Sort order
      page = 1,           // Page number
      limit = 20          // Results per page
    } = req.query;

    // Build filters object
    const filters = {};

    if (brand) filters.brand = brand;
    if (model) filters.model = model;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (condition) filters.condition = Array.isArray(condition) ? condition : condition.split(',');
    if (year) filters.year = parseInt(year);
    if (classifications) filters.classifications = classifications.split(',').map(c => c.trim());
    if (movement) filters.movement = movement;
    if (caseMaterial) filters.caseMaterial = caseMaterial;
    if (dialColor) filters.dialColor = dialColor;
    if (sellerId) filters.sellerId = sellerId;
    if (featured === 'true') filters.featured = true;

    // Calculate pagination
    const from = (page - 1) * limit;

    // Check cache if Redis is available
    const cacheKey = generateCacheKey('search', { q, filters, sort, from, limit });
    if (redisAvailable) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          console.log('Returning cached search results');
          return res.json(JSON.parse(cached));
        }
      } catch (error) {
        console.error('Cache read error:', error.message);
      }
    }

    // Perform search
    const results = await searchWatches({
      query: q,
      filters,
      sort,
      from,
      size: parseInt(limit),
      aggregations: true
    });

    // Format response
    const response = {
      watches: results.hits,
      total: results.total,
      page: parseInt(page),
      pages: Math.ceil(results.total / limit),
      facets: formatFacets(results.aggregations)
    };

    // Cache for 5 minutes if Redis is available
    if (redisAvailable) {
      try {
        await redis.setex(cacheKey, 300, JSON.stringify(response));
      } catch (error) {
        console.error('Cache write error:', error.message);
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      message: 'Search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Autocomplete/suggestions endpoint
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    // Check cache if Redis is available
    const cacheKey = generateCacheKey('suggestions', { q });
    if (redisAvailable) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      } catch (error) {
        console.error('Cache read error:', error.message);
      }
    }

    // Get suggestions
    const suggestions = await getSuggestions(q);

    const response = { suggestions };

    // Cache for 1 hour if Redis is available
    if (redisAvailable) {
      try {
        await redis.setex(cacheKey, 3600, JSON.stringify(response));
      } catch (error) {
        console.error('Cache write error:', error.message);
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ suggestions: [] });
  }
});

// Similar watches endpoint
router.get('/watches/:id/similar', async (req, res) => {
  try {
    const { id } = req.params;
    const { limit = 6 } = req.query;

    // Check cache if Redis is available
    const cacheKey = generateCacheKey('similar', { id, limit });
    if (redisAvailable) {
      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      } catch (error) {
        console.error('Cache read error:', error.message);
      }
    }

    // Find similar watches
    const similar = await findSimilarWatches(id, parseInt(limit));

    const response = { watches: similar };

    // Cache for 1 hour if Redis is available
    if (redisAvailable) {
      try {
        await redis.setex(cacheKey, 3600, JSON.stringify(response));
      } catch (error) {
        console.error('Cache write error:', error.message);
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Similar watches error:', error);
    res.status(500).json({ watches: [] });
  }
});

// Track search queries for analytics
router.post('/track', async (req, res) => {
  try {
    const { query, resultsCount, clickedResult, userId } = req.body;

    // Store search analytics (you can expand this)
    const analyticsData = {
      query,
      resultsCount,
      clickedResult,
      userId: userId || req.session?.user?._id,
      timestamp: new Date(),
      sessionId: req.sessionID
    };

    // Store in Redis for quick analytics if available
    if (redisAvailable) {
      try {
        await redis.lpush('search:analytics', JSON.stringify(analyticsData));
        await redis.ltrim('search:analytics', 0, 9999); // Keep last 10,000 searches
      } catch (error) {
        console.error('Analytics storage error:', error.message);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking search:', error);
    res.status(500).json({ success: false });
  }
});

// Track watch view for popularity metrics
router.post('/watches/:id/view', async (req, res) => {
  try {
    const { id } = req.params;

    // Increment view count in MongoDB
    const Watch = (await import('../db/watchModel.js')).default;
    const watch = await Watch.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (watch) {
      // Update OpenSearch metrics
      await updateSearchMetrics(id, {
        viewCount: watch.viewCount || 1,
        bidCount: watch.bidCount || 0,
        favoriteCount: watch.favoriteCount || 0,
        inquiryCount: watch.inquiryCount || 0
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error tracking view:', error);
    res.status(500).json({ success: false });
  }
});

// Get popular searches
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Get recent searches from Redis if available
    let recentSearches = [];
    if (redisAvailable) {
      try {
        recentSearches = await redis.lrange('search:analytics', 0, 999);
      } catch (error) {
        console.error('Error getting recent searches:', error.message);
      }
    }

    // Count query frequency
    const queryCount = {};
    recentSearches.forEach(searchStr => {
      try {
        const search = JSON.parse(searchStr);
        if (search.query) {
          queryCount[search.query] = (queryCount[search.query] || 0) + 1;
        }
      } catch (e) {
        // Ignore parse errors
      }
    });

    // Sort by frequency and get top N
    const popular = Object.entries(queryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, parseInt(limit))
      .map(([query, count]) => ({ query, count }));

    res.json({ popular });
  } catch (error) {
    console.error('Error getting popular searches:', error);
    res.json({ popular: [] });
  }
});

// Get trending watches based on recent activity
router.get('/trending', async (req, res) => {
  try {
    const { limit = 12 } = req.query;

    // Search for watches with high recent activity
    const results = await searchWatches({
      filters: { status: 'active' },
      sort: {
        'metrics.view_count': 'desc',
        'metrics.bid_count': 'desc'
      },
      from: 0,
      size: parseInt(limit),
      aggregations: false
    });

    res.json({ watches: results.hits });
  } catch (error) {
    console.error('Error getting trending watches:', error);
    res.status(500).json({ watches: [] });
  }
});

// Helper function to format facets for frontend
function formatFacets(aggregations) {
  if (!aggregations) return {};

  const facets = {};

  // Brand facet
  if (aggregations.brands) {
    facets.brands = aggregations.brands.buckets.map(bucket => ({
      value: bucket.key,
      count: bucket.doc_count
    }));
  }

  // Price range facet
  if (aggregations.price_ranges) {
    facets.priceRanges = aggregations.price_ranges.buckets.map(bucket => ({
      label: bucket.key,
      from: bucket.from,
      to: bucket.to,
      count: bucket.doc_count
    }));
  }

  // Condition facet
  if (aggregations.conditions) {
    facets.conditions = aggregations.conditions.buckets.map(bucket => ({
      value: bucket.key,
      count: bucket.doc_count
    }));
  }

  // Classifications facet
  if (aggregations.classifications) {
    facets.classifications = aggregations.classifications.buckets.map(bucket => ({
      value: bucket.key,
      count: bucket.doc_count
    }));
  }

  // Case materials facet
  if (aggregations.case_materials) {
    facets.caseMaterials = aggregations.case_materials.buckets.map(bucket => ({
      value: bucket.key,
      count: bucket.doc_count
    }));
  }

  // Movement types facet
  if (aggregations.movements) {
    facets.movements = aggregations.movements.buckets.map(bucket => ({
      value: bucket.key,
      count: bucket.doc_count
    }));
  }

  // Statistics
  if (aggregations.avg_price) {
    facets.avgPrice = aggregations.avg_price.value;
  }

  if (aggregations.total_watches) {
    facets.totalWatches = aggregations.total_watches.value;
  }

  return facets;
}

export default router;