# Data Specialist Sub-Agent Guide

## Overview

The Data Specialist Sub-Agent is a powerful database query and analytics engine for the Juno Marketplace. It provides a unified interface for querying MongoDB collections, generating insights, and performing complex data analysis operations.

## Features

- **Natural Language Queries**: Convert plain English questions into database queries
- **Pre-built Query Templates**: Common queries ready to use
- **Advanced Aggregation Pipelines**: Complex data transformations and analytics
- **Real-time Insights**: Business metrics and recommendations
- **Batch Operations**: Execute multiple queries in parallel
- **Performance Optimized**: Efficient query execution with proper indexing

## API Endpoints

### Base URL
```
http://localhost:8001/api/data
```

### Available Endpoints

#### 1. Execute Structured Query
```http
POST /api/data/query
```
Execute a structured database query with full control over filters, projections, and aggregations.

**Request Body:**
```json
{
  "type": "find",
  "entity": "watch",
  "filters": {
    "status": "available",
    "price": { "$gte": 10000, "$lte": 50000 }
  },
  "projection": "brand model price status",
  "sort": { "price": -1 },
  "limit": 10
}
```

#### 2. Natural Language Query
```http
POST /api/data/natural-query
```
Convert natural language questions into database queries.

**Request Body:**
```json
{
  "query": "Show me all available Rolex watches under $50,000"
}
```

#### 3. Get Entity Statistics
```http
GET /api/data/stats/:entity
```
Get comprehensive statistics for any entity (watch, user, bid, transaction).

**Example:**
```http
GET /api/data/stats/watch?filters={"status":"available"}
```

#### 4. Get Business Insights
```http
GET /api/data/insights/:entity
```
Get AI-powered insights and recommendations.

**Entities:**
- `marketplace` - Overall marketplace insights
- `watch` - Watch inventory insights
- `user` - User behavior insights
- `sales` - Sales performance insights

#### 5. Search Documents
```http
POST /api/data/search
```
Full-text search across entity fields.

**Request Body:**
```json
{
  "entity": "watch",
  "searchTerm": "Rolex Submariner",
  "filters": { "status": "available" }
}
```

#### 6. Custom Aggregation
```http
POST /api/data/aggregate
```
Execute custom MongoDB aggregation pipelines.

**Request Body:**
```json
{
  "entity": "watch",
  "pipeline": [
    { "$match": { "status": "available" } },
    { "$group": { 
      "_id": "$brand",
      "count": { "$sum": 1 },
      "avgPrice": { "$avg": "$price" }
    }},
    { "$sort": { "count": -1 } }
  ]
}
```

#### 7. Dashboard Data
```http
GET /api/data/dashboard
```
Get comprehensive dashboard data including overview, trends, and recommendations.

#### 8. Batch Queries
```http
POST /api/data/batch-query
```
Execute multiple queries in parallel for optimal performance.

**Request Body:**
```json
{
  "queries": [
    {
      "type": "stats",
      "entity": "watch"
    },
    {
      "type": "find",
      "entity": "bid",
      "filters": { "status": "offered" },
      "limit": 5
    }
  ]
}
```

## Natural Language Query Examples

The Data Specialist can understand various natural language queries:

### Watch Queries
- "Show me all available watches"
- "Find Rolex watches under $30,000"
- "What are the most expensive watches?"
- "Show me watches added this week"
- "Find luxury watches over $100,000"

### Bid Queries
- "Show me pending bids"
- "What are the highest bids today?"
- "Find all accepted bids this month"
- "Show me bids over $50,000"

### User Queries
- "How many active users do we have?"
- "Show me new users this month"
- "Find users who have made purchases"
- "Who are the top buyers?"

### Analytics Queries
- "Show me sales statistics"
- "What's the marketplace overview?"
- "Generate insights for watch inventory"
- "Show me revenue trends"

## Query Templates

Pre-built query templates are available for common operations:

### Using Templates in Code
```javascript
import { QueryTemplates, executeTemplate } from './services/queryTemplates.js';
import DataSpecialist from './services/dataSpecialist.js';

const dataSpecialist = new DataSpecialist();

// Use a simple template
const availableWatches = await executeTemplate(
  dataSpecialist,
  'watches.getAvailable'
);

// Use a template with parameters
const rolexWatches = await executeTemplate(
  dataSpecialist,
  'watches.getByBrand',
  'Rolex'
);

// Use a price range template
const midRangeWatches = await executeTemplate(
  dataSpecialist,
  'watches.getByPriceRange',
  10000,
  50000
);
```

### Available Templates

#### Watch Templates
- `watches.getAvailable` - All available watches
- `watches.getByBrand(brand)` - Watches by specific brand
- `watches.getByPriceRange(min, max)` - Watches in price range
- `watches.getLuxury` - Luxury watches (>$50,000)
- `watches.getRecent(days)` - Recently added watches
- `watches.getWithBids` - Watches with active bids
- `watches.getPriceStatsByBrand` - Price statistics by brand

#### Bid Templates
- `bids.getPending` - Pending bid offers
- `bids.getByWatch(watchId)` - Bids for specific watch
- `bids.getByUser(email)` - Bids by user email
- `bids.getAccepted` - Accepted bids
- `bids.getHighValue` - High-value bids (>$10,000)
- `bids.getStatsByStatus` - Bid statistics by status
- `bids.getTopBidders` - Top 10 bidders by value

#### Transaction Templates
- `transactions.getCompleted` - Completed orders
- `transactions.getPending` - Pending orders
- `transactions.getByBuyer(buyerId)` - Orders by buyer
- `transactions.getHighValueRecent` - Recent high-value sales
- `transactions.getMonthlyRevenue` - Monthly revenue breakdown
- `transactions.getSalesByBrand` - Sales analysis by brand

#### User Templates
- `users.getActive` - Active users
- `users.getAdmins` - Admin users
- `users.getNewUsers` - New users (last 30 days)
- `users.getBuyers` - Users with purchases
- `users.getEngagementMetrics` - User engagement metrics

#### Report Templates
- `reports.getOverview` - Marketplace overview
- `reports.getDailyActivity` - Daily activity (last 30 days)
- `reports.getInventorySummary` - Inventory breakdown
- `reports.getConversionFunnel` - Bid to sale conversion

#### Analytics Templates
- `analytics.getCustomerLifetimeValue` - CLV analysis
- `analytics.getDemandByBrand` - Brand demand analysis

## Aggregation Utilities

The Data Specialist includes powerful aggregation utilities for complex queries:

### Using Aggregation Utils
```javascript
import AggregationUtils from './services/aggregationUtils.js';

// Build a time-based aggregation
const pipeline = AggregationUtils.buildPipeline([
  AggregationUtils.dateRangeFilter('created_at', '2024-01-01', '2024-12-31'),
  AggregationUtils.groupByTimePeriod('created_at', 'month', {
    count: { $sum: 1 },
    revenue: { $sum: '$price' }
  }),
  ...AggregationUtils.paginate(1, 10)
]);

// Execute the pipeline
const results = await dataSpecialist.aggregateData('watch', pipeline);
```

### Available Utilities
- `dateRangeFilter` - Filter by date range
- `paginate` - Add pagination
- `groupByTimePeriod` - Group by day/week/month/year
- `bucketize` - Create value buckets
- `facetedSearch` - Multiple aggregations in parallel
- `windowFunction` - Advanced analytics windows
- `calculateRunningTotal` - Running totals
- `textSearch` - Full-text search with scoring

## Performance Optimization

### Best Practices

1. **Use Projections**: Only request fields you need
```json
{
  "type": "find",
  "entity": "watch",
  "projection": "brand model price"
}
```

2. **Limit Results**: Always set reasonable limits
```json
{
  "type": "find",
  "entity": "watch",
  "limit": 20
}
```

3. **Use Batch Queries**: Execute multiple queries in parallel
```json
{
  "queries": [
    { "type": "stats", "entity": "watch" },
    { "type": "stats", "entity": "user" }
  ]
}
```

4. **Cache Dashboard Data**: The dashboard endpoint is optimized for frequent access

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common error codes:
- `400` - Bad request (missing parameters)
- `404` - Entity not found
- `500` - Server error

## Integration Examples

### Frontend Integration
```javascript
// React component example
const fetchWatchStats = async () => {
  try {
    const response = await fetch('/api/data/stats/watch');
    const data = await response.json();
    
    if (data.success) {
      setWatchStats(data.data);
    }
  } catch (error) {
    console.error('Failed to fetch watch stats:', error);
  }
};
```

### Admin Dashboard Integration
```javascript
// Get comprehensive dashboard data
const loadDashboard = async () => {
  const response = await fetch('/api/data/dashboard');
  const { data } = await response.json();
  
  // Use the data
  updateOverview(data.overview);
  renderTrends(data.trends);
  showRecommendations(data.recommendations);
};
```

### Natural Language Search
```javascript
// Search bar implementation
const handleSearch = async (query) => {
  const response = await fetch('/api/data/natural-query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  const result = await response.json();
  displayResults(result.data);
};
```

## Advanced Use Cases

### 1. Customer Segmentation
```javascript
const segmentCustomers = async () => {
  const pipeline = [
    {
      $lookup: {
        from: 'transactions',
        localField: '_id',
        foreignField: 'buyer',
        as: 'purchases'
      }
    },
    {
      $addFields: {
        totalSpent: { $sum: '$purchases.totalPrice' },
        purchaseCount: { $size: '$purchases' }
      }
    },
    {
      $bucket: {
        groupBy: '$totalSpent',
        boundaries: [0, 1000, 5000, 10000, 50000, 100000],
        default: 'VIP',
        output: {
          users: { $sum: 1 },
          avgPurchases: { $avg: '$purchaseCount' }
        }
      }
    }
  ];
  
  return await dataSpecialist.aggregateData('user', pipeline);
};
```

### 2. Demand Forecasting
```javascript
const forecastDemand = async (brand) => {
  const historicalData = await executeTemplate(
    dataSpecialist,
    'analytics.getDemandByBrand'
  );
  
  // Analyze bid patterns
  const bidTrends = await dataSpecialist.executeQuery({
    type: 'aggregate',
    entity: 'bid',
    aggregation: [
      { $match: { status: 'offered' } },
      { $lookup: {
        from: 'watches',
        localField: 'watch',
        foreignField: '_id',
        as: 'watchData'
      }},
      { $match: { 'watchData.brand': brand } },
      { $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
        bidCount: { $sum: 1 },
        avgBidAmount: { $avg: '$amount' }
      }}
    ]
  });
  
  return { historicalData, bidTrends };
};
```

### 3. Price Optimization
```javascript
const optimizePricing = async (watchId) => {
  // Get similar watches and their performance
  const watch = await Watch.findById(watchId);
  
  const similarWatches = await dataSpecialist.executeQuery({
    type: 'find',
    entity: 'watch',
    filters: {
      brand: watch.brand,
      price: { 
        $gte: watch.price * 0.8,
        $lte: watch.price * 1.2
      },
      _id: { $ne: watchId }
    }
  });
  
  // Analyze bid patterns for similar watches
  const bidAnalysis = await dataSpecialist.executeQuery({
    type: 'aggregate',
    entity: 'bid',
    aggregation: [
      { $match: { 
        watch: { $in: similarWatches.results.map(w => w._id) }
      }},
      { $group: {
        _id: '$watch',
        avgBid: { $avg: '$amount' },
        bidCount: { $sum: 1 }
      }}
    ]
  });
  
  return { similarWatches, bidAnalysis };
};
```

## Monitoring & Debugging

### Query Performance
Monitor query execution time by checking the response headers:
```
X-Query-Time: 45ms
X-Result-Count: 250
```

### Debug Mode
Enable debug mode for detailed query execution logs:
```json
{
  "type": "find",
  "entity": "watch",
  "debug": true
}
```

## Security Considerations

1. **Authentication**: All `/api/data` endpoints require authenticated sessions
2. **Rate Limiting**: Queries are rate-limited to prevent abuse
3. **Query Validation**: All aggregation pipelines are validated before execution
4. **Data Sanitization**: Input parameters are sanitized to prevent injection attacks

## Troubleshooting

### Common Issues

1. **Empty Results**
   - Check filters are correct
   - Verify entity name spelling
   - Ensure data exists matching criteria

2. **Slow Queries**
   - Add appropriate indexes
   - Limit result set size
   - Use projections to reduce data transfer

3. **Aggregation Errors**
   - Validate pipeline syntax
   - Check field names match schema
   - Ensure proper stage order

## Support

For issues or feature requests related to the Data Specialist Sub-Agent:
1. Check this documentation first
2. Review the query templates for examples
3. Contact the development team with specific error messages

## Future Enhancements

Planned features for the Data Specialist:
- Machine learning predictions
- Real-time data streaming
- GraphQL interface
- Custom alert system
- Advanced caching strategies
- Query result export (CSV, Excel)
- Scheduled report generation