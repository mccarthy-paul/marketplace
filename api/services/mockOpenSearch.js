/**
 * Mock OpenSearch Service
 * This provides a fallback implementation when OpenSearch is not available
 * It uses MongoDB directly to provide basic search functionality
 */

import Watch from '../db/watchModel.js';

// Mock search function that uses MongoDB
export async function mockSearchWatches({
  query = '',
  filters = {},
  sort = 'relevance',
  from = 0,
  size = 20,
  aggregations = false
}) {
  try {
    // Build MongoDB query
    const mongoQuery = { status: 'active' };

    // Text search
    if (query) {
      mongoQuery.$or = [
        { brand: { $regex: query, $options: 'i' } },
        { model: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { reference_number: { $regex: query, $options: 'i' } }
      ];
    }

    // Apply filters
    if (filters.brand) mongoQuery.brand = filters.brand;
    if (filters.model) mongoQuery.model = filters.model;
    if (filters.minPrice || filters.maxPrice) {
      mongoQuery.price = {};
      if (filters.minPrice) mongoQuery.price.$gte = filters.minPrice;
      if (filters.maxPrice) mongoQuery.price.$lte = filters.maxPrice;
    }
    if (filters.condition) {
      mongoQuery.condition = { $in: Array.isArray(filters.condition) ? filters.condition : [filters.condition] };
    }
    if (filters.year) mongoQuery.year = filters.year;
    if (filters.sellerId) mongoQuery.sellerId = filters.sellerId;

    // Build sort
    let mongoSort = {};
    switch (sort) {
      case 'price_asc':
        mongoSort = { price: 1 };
        break;
      case 'price_desc':
        mongoSort = { price: -1 };
        break;
      case 'newest':
        mongoSort = { created_at: -1 };
        break;
      default:
        mongoSort = { created_at: -1 };
    }

    // Execute query
    const [watches, total] = await Promise.all([
      Watch.find(mongoQuery)
        .sort(mongoSort)
        .skip(from)
        .limit(size)
        .lean(),
      Watch.countDocuments(mongoQuery)
    ]);

    // Build aggregations if requested
    let aggs = {};
    if (aggregations) {
      const allWatches = await Watch.find({ status: 'active' }).lean();

      // Brand aggregation
      const brandCounts = {};
      allWatches.forEach(w => {
        if (w.brand) {
          brandCounts[w.brand] = (brandCounts[w.brand] || 0) + 1;
        }
      });

      aggs.brands = {
        buckets: Object.entries(brandCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([key, count]) => ({ key, doc_count: count }))
      };

      // Price ranges
      const priceRanges = [
        { key: 'Under $5,000', from: 0, to: 5000 },
        { key: '$5,000 - $10,000', from: 5000, to: 10000 },
        { key: '$10,000 - $25,000', from: 10000, to: 25000 },
        { key: '$25,000 - $50,000', from: 25000, to: 50000 },
        { key: 'Over $50,000', from: 50000 }
      ];

      aggs.price_ranges = {
        buckets: priceRanges.map(range => ({
          ...range,
          doc_count: allWatches.filter(w => {
            const price = w.price || 0;
            if (range.to) {
              return price >= range.from && price < range.to;
            }
            return price >= range.from;
          }).length
        }))
      };

      // Conditions
      const conditionCounts = {};
      allWatches.forEach(w => {
        if (w.condition) {
          conditionCounts[w.condition] = (conditionCounts[w.condition] || 0) + 1;
        }
      });

      aggs.conditions = {
        buckets: Object.entries(conditionCounts)
          .map(([key, count]) => ({ key, doc_count: count }))
      };
    }

    return {
      hits: watches.map(w => ({
        _id: w._id,
        _source: w,
        _score: 1.0
      })),
      total,
      aggregations: aggs
    };
  } catch (error) {
    console.error('Mock search error:', error);
    throw error;
  }
}

// Mock suggestions function
export async function mockGetSuggestions(query) {
  try {
    if (!query || query.length < 2) return [];

    // Get unique brands and models
    const watches = await Watch.find({ status: 'active' })
      .select('brand model')
      .lean();

    const suggestions = new Set();

    watches.forEach(w => {
      // Check if brand matches
      if (w.brand && w.brand.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(JSON.stringify({ text: w.brand, type: 'brand', score: 0.9 }));
      }

      // Check if model matches
      if (w.model && w.model.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(JSON.stringify({
          text: `${w.brand} ${w.model}`,
          type: 'model',
          score: 0.8
        }));
      }
    });

    return Array.from(suggestions)
      .map(s => JSON.parse(s))
      .slice(0, 10);
  } catch (error) {
    console.error('Mock suggestions error:', error);
    return [];
  }
}

// Mock similar watches function
export async function mockFindSimilarWatches(watchId, limit = 6) {
  try {
    const watch = await Watch.findById(watchId).lean();
    if (!watch) return [];

    // Find similar watches based on brand and price range
    const priceMin = watch.price * 0.7;
    const priceMax = watch.price * 1.3;

    const similar = await Watch.find({
      _id: { $ne: watchId },
      status: 'active',
      $or: [
        { brand: watch.brand },
        { price: { $gte: priceMin, $lte: priceMax } }
      ]
    })
    .limit(limit)
    .lean();

    return similar.map(w => ({
      _id: w._id,
      _source: w,
      _score: 1.0
    }));
  } catch (error) {
    console.error('Mock find similar error:', error);
    return [];
  }
}

// Export mock client
export const mockClient = {
  indices: {
    exists: async () => ({ body: false }),
    create: async () => ({ body: { acknowledged: true } }),
    delete: async () => ({ body: { acknowledged: true } })
  },
  index: async () => ({ body: { result: 'created' } }),
  update: async () => ({ body: { result: 'updated' } }),
  delete: async () => ({ body: { result: 'deleted' } }),
  search: async (params) => {
    const results = await mockSearchWatches(params.body || {});
    return { body: { hits: results } };
  }
};

export default {
  searchWatches: mockSearchWatches,
  getSuggestions: mockGetSuggestions,
  findSimilarWatches: mockFindSimilarWatches,
  client: mockClient
};