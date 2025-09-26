import { Client } from '@opensearch-project/opensearch';
import dotenv from 'dotenv';
import mockOpenSearch from './mockOpenSearch.js';

dotenv.config();

let opensearchClient;
let useMock = false;

// Try to initialize OpenSearch client
try {
  opensearchClient = new Client({
    node: process.env.OPENSEARCH_URL || 'https://localhost:9200',
    auth: {
      username: process.env.OPENSEARCH_USERNAME || 'admin',
      password: process.env.OPENSEARCH_PASSWORD || 'Admin123!'
    },
    ssl: {
      rejectUnauthorized: false // For development only
    }
  });

  // Test connection - if it fails, use mock
  await opensearchClient.ping().catch(() => {
    console.log('⚠️ OpenSearch is not available, using mock implementation');
    useMock = true;
  });
} catch (error) {
  console.log('⚠️ OpenSearch client initialization failed, using mock implementation');
  useMock = true;
}

// Use mock if OpenSearch is not available
if (useMock) {
  opensearchClient = mockOpenSearch.client;
}

// Index name
const WATCH_INDEX = 'watches';

// Watch index mapping
const WATCH_MAPPING = {
  mappings: {
    properties: {
      // Core identifiers
      id: { type: 'keyword' },
      sku: { type: 'keyword' },
      status: { type: 'keyword' },

      // Text search fields with multiple analyzers
      brand: {
        type: 'text',
        fields: {
          keyword: { type: 'keyword' },
          lowercase: {
            type: 'text',
            analyzer: 'lowercase'
          },
          completion: {
            type: 'completion',
            analyzer: 'simple'
          }
        }
      },
      model: {
        type: 'text',
        fields: {
          keyword: { type: 'keyword' },
          lowercase: {
            type: 'text',
            analyzer: 'lowercase'
          },
          completion: {
            type: 'completion',
            analyzer: 'simple'
          }
        }
      },
      reference_number: {
        type: 'text',
        fields: {
          keyword: { type: 'keyword' },
          normalized: {
            type: 'text',
            analyzer: 'custom_normalizer'
          }
        }
      },
      description: {
        type: 'text',
        analyzer: 'english',
        fields: {
          shingles: {
            type: 'text',
            analyzer: 'shingle_analyzer'
          }
        }
      },

      // Numeric fields for range queries
      price: { type: 'float' },
      starting_bid: { type: 'float' },
      current_bid: { type: 'float' },
      year: { type: 'integer' },

      // Categorical fields for faceting
      condition: { type: 'keyword' },
      currency: { type: 'keyword' },
      classifications: { type: 'keyword' },

      // Specifications object
      specs: {
        properties: {
          case_size: { type: 'keyword' },
          case_material: { type: 'keyword' },
          dial_color: { type: 'keyword' },
          movement: { type: 'keyword' },
          bracelet_material: { type: 'keyword' },
          box_papers: { type: 'keyword' }
        }
      },

      // Seller information
      seller: {
        properties: {
          id: { type: 'keyword' },
          name: {
            type: 'text',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          company: {
            type: 'text',
            fields: {
              keyword: { type: 'keyword' }
            }
          },
          rating: { type: 'float' },
          verified: { type: 'boolean' },
          total_sales: { type: 'integer' }
        }
      },

      // Location for geo queries
      location: {
        properties: {
          country: { type: 'keyword' },
          city: { type: 'keyword' },
          coordinates: { type: 'geo_point' }
        }
      },

      // Timestamps
      created_at: { type: 'date' },
      updated_at: { type: 'date' },

      // Engagement metrics for ranking
      metrics: {
        properties: {
          view_count: { type: 'integer' },
          bid_count: { type: 'integer' },
          favorite_count: { type: 'integer' },
          inquiry_count: { type: 'integer' }
        }
      },

      // Images
      images: { type: 'keyword' },
      primary_image: { type: 'keyword' },

      // Featured/boosting
      featured: { type: 'boolean' },
      boost_score: { type: 'float' }
    }
  },
  settings: {
    number_of_shards: 2,
    number_of_replicas: 1,
    analysis: {
      analyzer: {
        custom_normalizer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding']
        },
        shingle_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'shingle']
        }
      },
      filter: {
        shingle: {
          type: 'shingle',
          min_shingle_size: 2,
          max_shingle_size: 3
        }
      }
    }
  }
};

// Initialize index with mapping
export async function initializeIndex() {
  try {
    // Check if index exists
    const indexExists = await opensearchClient.indices.exists({
      index: WATCH_INDEX
    });

    if (!indexExists.body) {
      // Create index with mapping
      await opensearchClient.indices.create({
        index: WATCH_INDEX,
        body: WATCH_MAPPING
      });
      console.log(`Created OpenSearch index: ${WATCH_INDEX}`);
    } else {
      console.log(`OpenSearch index ${WATCH_INDEX} already exists`);
    }
  } catch (error) {
    console.error('Error initializing OpenSearch index:', error);
    throw error;
  }
}

// Transform MongoDB watch to OpenSearch document
export function transformWatchForSearch(watch) {
  return {
    id: watch._id.toString(),
    sku: watch.metadata?.sku || null,
    status: watch.status,

    // Text fields
    brand: watch.brand,
    model: watch.model,
    reference_number: watch.reference_number,
    description: watch.description,

    // Numeric fields
    price: watch.price || null,
    starting_bid: watch.starting_bid || watch.currentBid || 0,
    current_bid: watch.currentBid || 0,
    year: watch.year || null,

    // Categorical
    condition: watch.condition,
    currency: watch.currency || 'USD',
    classifications: watch.classifications || [],

    // Specifications
    specs: {
      case_size: watch.metadata?.case_size,
      case_material: watch.metadata?.case_material,
      dial_color: watch.metadata?.dial_color,
      movement: watch.metadata?.movement,
      bracelet_material: watch.metadata?.bracelet_material,
      box_papers: watch.metadata?.box_papers
    },

    // Seller info
    seller: watch.owner ? {
      id: watch.owner._id?.toString() || watch.owner.toString(),
      name: watch.owner.name || null,
      company: watch.owner.company_name || null,
      rating: watch.owner.sellerStats?.rating || 0,
      verified: watch.owner.verified || false,
      total_sales: watch.owner.sellerStats?.totalSales || 0
    } : null,

    // Location (if available)
    location: watch.location ? {
      country: watch.location.country,
      city: watch.location.city,
      coordinates: watch.location.coordinates
    } : null,

    // Timestamps
    created_at: watch.created_at,
    updated_at: watch.updated_at,

    // Metrics
    metrics: {
      view_count: watch.viewCount || 0,
      bid_count: watch.bidCount || 0,
      favorite_count: watch.favoriteCount || 0,
      inquiry_count: watch.inquiryCount || 0
    },

    // Images
    images: watch.images || [],
    primary_image: watch.imageUrl || watch.images?.[0] || null,

    // Featured
    featured: watch.featured || false,
    boost_score: watch.featuredOrder || 0
  };
}

// Index a single watch
export async function indexWatch(watch) {
  try {
    const document = transformWatchForSearch(watch);

    const response = await opensearchClient.index({
      index: WATCH_INDEX,
      id: document.id,
      body: document,
      refresh: true // Make it immediately searchable
    });

    return response.body;
  } catch (error) {
    console.error('Error indexing watch:', error);
    throw error;
  }
}

// Bulk index watches
export async function bulkIndexWatches(watches) {
  try {
    const operations = watches.flatMap(watch => {
      const document = transformWatchForSearch(watch);
      return [
        { index: { _index: WATCH_INDEX, _id: document.id } },
        document
      ];
    });

    const response = await opensearchClient.bulk({
      body: operations,
      refresh: true
    });

    if (response.body.errors) {
      const erroredDocuments = [];
      response.body.items.forEach((action, i) => {
        const operation = Object.keys(action)[0];
        if (action[operation].error) {
          erroredDocuments.push({
            status: action[operation].status,
            error: action[operation].error,
            document: watches[i]
          });
        }
      });
      console.error('Bulk indexing errors:', erroredDocuments);
    }

    return response.body;
  } catch (error) {
    console.error('Error bulk indexing watches:', error);
    throw error;
  }
}

// Update a watch in the index
export async function updateWatch(watchId, updates) {
  try {
    const response = await opensearchClient.update({
      index: WATCH_INDEX,
      id: watchId,
      body: {
        doc: updates
      },
      refresh: true
    });

    return response.body;
  } catch (error) {
    console.error('Error updating watch in OpenSearch:', error);
    throw error;
  }
}

// Delete a watch from the index
export async function deleteWatch(watchId) {
  try {
    const response = await opensearchClient.delete({
      index: WATCH_INDEX,
      id: watchId,
      refresh: true
    });

    return response.body;
  } catch (error) {
    console.error('Error deleting watch from OpenSearch:', error);
    throw error;
  }
}

// Search watches
export async function searchWatches(params) {
  // Use mock implementation if OpenSearch is not available
  if (useMock) {
    return mockOpenSearch.searchWatches(params);
  }

  const {
    query,
    filters = {},
    sort = { created_at: 'desc' },
    from = 0,
    size = 20,
    aggregations = true
  } = params;

  try {
    const searchBody = {
      from,
      size,
      query: buildSearchQuery(query, filters),
      sort: buildSortConfig(sort)
    };

    // Add aggregations for facets
    if (aggregations) {
      searchBody.aggs = buildAggregations();
    }

    const response = await opensearchClient.search({
      index: WATCH_INDEX,
      body: searchBody
    });

    return {
      hits: response.body.hits.hits.map(hit => ({
        ...hit._source,
        _score: hit._score,
        _id: hit._id
      })),
      total: response.body.hits.total.value,
      aggregations: response.body.aggregations || {}
    };
  } catch (error) {
    console.error('Error searching watches:', error);
    throw error;
  }
}

// Build search query
function buildSearchQuery(queryText, filters) {
  const must = [];
  const filter = [];
  const should = [];

  // Text search
  if (queryText) {
    must.push({
      multi_match: {
        query: queryText,
        fields: [
          'brand^3',
          'model^2.5',
          'reference_number^2',
          'description',
          'seller.company'
        ],
        type: 'best_fields',
        fuzziness: 'AUTO',
        prefix_length: 2
      }
    });

    // Boost exact matches
    should.push({
      multi_match: {
        query: queryText,
        fields: ['brand.keyword', 'model.keyword'],
        type: 'phrase',
        boost: 2
      }
    });
  }

  // Apply filters
  if (filters.brand) {
    filter.push({ term: { 'brand.keyword': filters.brand } });
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const rangeQuery = { range: { price: {} } };
    if (filters.minPrice !== undefined) rangeQuery.range.price.gte = filters.minPrice;
    if (filters.maxPrice !== undefined) rangeQuery.range.price.lte = filters.maxPrice;
    filter.push(rangeQuery);
  }

  if (filters.condition) {
    filter.push({ terms: { condition: Array.isArray(filters.condition) ? filters.condition : [filters.condition] } });
  }

  if (filters.year) {
    filter.push({ term: { year: filters.year } });
  }

  if (filters.classifications && filters.classifications.length > 0) {
    filter.push({ terms: { classifications: filters.classifications } });
  }

  if (filters.sellerId) {
    filter.push({ term: { 'seller.id': filters.sellerId } });
  }

  // Only show active watches by default
  if (filters.status === undefined) {
    filter.push({ term: { status: 'active' } });
  } else if (filters.status) {
    filter.push({ term: { status: filters.status } });
  }

  // Build final query
  if (must.length === 0 && filter.length === 0 && should.length === 0) {
    return { match_all: {} };
  }

  return {
    bool: {
      must,
      filter,
      should,
      minimum_should_match: should.length > 0 ? 1 : 0
    }
  };
}

// Build sort configuration
function buildSortConfig(sort) {
  const sortConfig = [];

  if (typeof sort === 'string') {
    switch (sort) {
      case 'price_asc':
        sortConfig.push({ price: { order: 'asc', missing: '_last' } });
        break;
      case 'price_desc':
        sortConfig.push({ price: { order: 'desc', missing: '_last' } });
        break;
      case 'newest':
        sortConfig.push({ created_at: { order: 'desc' } });
        break;
      case 'oldest':
        sortConfig.push({ created_at: { order: 'asc' } });
        break;
      case 'popular':
        sortConfig.push({ 'metrics.view_count': { order: 'desc' } });
        break;
      default:
        sortConfig.push({ _score: { order: 'desc' } });
    }
  } else {
    Object.entries(sort).forEach(([field, order]) => {
      sortConfig.push({ [field]: { order } });
    });
  }

  return sortConfig;
}

// Build aggregations for faceted search
function buildAggregations() {
  return {
    brands: {
      terms: {
        field: 'brand.keyword',
        size: 20,
        order: { _count: 'desc' }
      }
    },
    price_ranges: {
      range: {
        field: 'price',
        ranges: [
          { key: 'Under $5k', to: 5000 },
          { key: '$5k - $10k', from: 5000, to: 10000 },
          { key: '$10k - $25k', from: 10000, to: 25000 },
          { key: '$25k - $50k', from: 25000, to: 50000 },
          { key: '$50k - $100k', from: 50000, to: 100000 },
          { key: 'Over $100k', from: 100000 }
        ]
      }
    },
    conditions: {
      terms: {
        field: 'condition',
        size: 10
      }
    },
    classifications: {
      terms: {
        field: 'classifications',
        size: 15
      }
    },
    case_materials: {
      terms: {
        field: 'specs.case_material',
        size: 10
      }
    },
    movements: {
      terms: {
        field: 'specs.movement',
        size: 10
      }
    },
    avg_price: {
      avg: {
        field: 'price'
      }
    },
    total_watches: {
      value_count: {
        field: 'id'
      }
    }
  };
}

// Get suggestions for autocomplete
export async function getSuggestions(prefix) {
  // Use mock implementation if OpenSearch is not available
  if (useMock) {
    return mockOpenSearch.getSuggestions(prefix);
  }

  try {
    const response = await opensearchClient.search({
      index: WATCH_INDEX,
      body: {
        suggest: {
          brand_suggest: {
            prefix,
            completion: {
              field: 'brand.completion',
              size: 5,
              fuzzy: {
                fuzziness: 'AUTO'
              }
            }
          },
          model_suggest: {
            prefix,
            completion: {
              field: 'model.completion',
              size: 5
            }
          }
        }
      }
    });

    const suggestions = [];

    if (response.body.suggest.brand_suggest) {
      response.body.suggest.brand_suggest[0].options.forEach(option => {
        suggestions.push({
          text: option.text,
          type: 'brand',
          score: option._score
        });
      });
    }

    if (response.body.suggest.model_suggest) {
      response.body.suggest.model_suggest[0].options.forEach(option => {
        suggestions.push({
          text: option.text,
          type: 'model',
          score: option._score
        });
      });
    }

    return suggestions.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
}

// Find similar watches
export async function findSimilarWatches(watchId, size = 6) {
  // Use mock implementation if OpenSearch is not available
  if (useMock) {
    return mockOpenSearch.findSimilarWatches(watchId, size);
  }

  try {
    // First get the watch
    const watchResponse = await opensearchClient.get({
      index: WATCH_INDEX,
      id: watchId
    });

    const watch = watchResponse.body._source;

    // Find similar watches
    const response = await opensearchClient.search({
      index: WATCH_INDEX,
      body: {
        query: {
          bool: {
            must_not: [
              { term: { id: watchId } } // Exclude the same watch
            ],
            should: [
              { term: { 'brand.keyword': { value: watch.brand, boost: 3 } } },
              { term: { 'model.keyword': { value: watch.model, boost: 2 } } },
              { terms: { classifications: watch.classifications || [] } },
              {
                range: {
                  price: {
                    gte: watch.price * 0.7,
                    lte: watch.price * 1.3
                  }
                }
              }
            ],
            minimum_should_match: 1
          }
        },
        size
      }
    });

    return response.body.hits.hits.map(hit => ({
      ...hit._source,
      _score: hit._score
    }));
  } catch (error) {
    console.error('Error finding similar watches:', error);
    return [];
  }
}

export default opensearchClient;