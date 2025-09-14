import express from 'express';
import DataSpecialist from '../services/dataSpecialist.js';

const router = express.Router();
const dataSpecialist = new DataSpecialist();

/**
 * POST /api/data/query
 * Execute a structured database query
 */
router.post('/query', async (req, res) => {
  try {
    const queryRequest = req.body;
    const results = await dataSpecialist.executeQuery(queryRequest);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Query execution error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/data/natural-query
 * Execute a query from natural language
 */
router.post('/natural-query', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query text is required'
      });
    }

    // Parse natural language to structured query
    const structuredQuery = dataSpecialist.parseNaturalQuery(query);
    
    // Execute the query
    const results = await dataSpecialist.executeQuery(structuredQuery);
    
    res.json({
      success: true,
      query: structuredQuery,
      data: results
    });
  } catch (error) {
    console.error('Natural query error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/data/stats/:entity
 * Get statistics for a specific entity
 */
router.get('/stats/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    
    const stats = await dataSpecialist.getStatistics(entity, filters);
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/data/insights/:entity
 * Get business insights for a specific entity
 */
router.get('/insights/:entity', async (req, res) => {
  try {
    const { entity } = req.params;
    const filters = req.query.filters ? JSON.parse(req.query.filters) : {};
    
    const insights = await dataSpecialist.getInsights(entity, filters);
    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    console.error('Insights error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/data/search
 * Search across entities
 */
router.post('/search', async (req, res) => {
  try {
    const { entity, searchTerm, filters = {} } = req.body;
    
    if (!entity || !searchTerm) {
      return res.status(400).json({
        success: false,
        error: 'Entity and search term are required'
      });
    }
    
    const results = await dataSpecialist.searchDocuments(entity, searchTerm, filters);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/data/aggregate
 * Execute custom aggregation pipeline
 */
router.post('/aggregate', async (req, res) => {
  try {
    const { entity, pipeline } = req.body;
    
    if (!entity || !pipeline) {
      return res.status(400).json({
        success: false,
        error: 'Entity and pipeline are required'
      });
    }
    
    const results = await dataSpecialist.aggregateData(entity, pipeline);
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/data/dashboard
 * Get comprehensive dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [
      marketplaceOverview,
      marketplaceTrends,
      recommendations,
      topBrands,
      recentActivity
    ] = await Promise.all([
      dataSpecialist.getMarketplaceOverview(),
      dataSpecialist.getMarketplaceTrends(),
      dataSpecialist.getMarketplaceRecommendations(),
      dataSpecialist.getPopularBrands(),
      dataSpecialist.getRecentTransactions({}, 5)
    ]);

    res.json({
      success: true,
      data: {
        overview: marketplaceOverview,
        trends: marketplaceTrends,
        recommendations,
        topBrands,
        recentActivity
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/data/batch-query
 * Execute multiple queries in parallel
 */
router.post('/batch-query', async (req, res) => {
  try {
    const { queries } = req.body;
    
    if (!queries || !Array.isArray(queries)) {
      return res.status(400).json({
        success: false,
        error: 'Queries array is required'
      });
    }
    
    const results = await Promise.all(
      queries.map(query => dataSpecialist.executeQuery(query))
    );
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Batch query error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;