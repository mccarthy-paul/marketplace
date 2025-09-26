# OpenSearch Implementation Guide

## Overview

This implementation uses **OpenSearch** (Apache 2.0 licensed) instead of Elasticsearch to provide advanced search capabilities for the watch marketplace. OpenSearch is a 100% open-source, community-driven fork of Elasticsearch 7.10.

## Why OpenSearch?

- ✅ **100% Open Source** - Apache 2.0 license, no licensing concerns
- ✅ **Drop-in Replacement** - Compatible with Elasticsearch APIs
- ✅ **AWS Backing** - Maintained by Amazon and the community
- ✅ **Free Security Features** - Authentication, encryption, and access control included
- ✅ **Production Ready** - Used by major companies worldwide

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   React UI   │────▶│ Express API  │────▶│  OpenSearch  │     │    Redis     │
│  Search Box  │     │  /api/search │     │   Cluster    │     │    Cache     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                            │                     ▲
                            ▼                     │
                     ┌──────────────┐            │
                     │   MongoDB    │────────────┘
                     │ Change Stream│  Real-time Sync
                     └──────────────┘
```

## Quick Start

### 1. Install Dependencies

```bash
# Make setup script executable
chmod +x setup-opensearch.sh

# Run setup script
./setup-opensearch.sh
```

Or manually:

```bash
# Backend packages
cd api
pnpm add @opensearch-project/opensearch ioredis

# Frontend packages
cd ..
pnpm add lodash use-debounce
```

### 2. Start OpenSearch Services

```bash
# Start OpenSearch, OpenSearch Dashboards, and Redis
docker-compose -f docker-compose.opensearch.yml up -d

# Check status
docker-compose -f docker-compose.opensearch.yml ps
```

### 3. Configure Environment Variables

Add to your `.env` file:

```env
# OpenSearch Configuration
OPENSEARCH_URL=https://localhost:9200
OPENSEARCH_USERNAME=admin
OPENSEARCH_PASSWORD=Admin123!

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Initialize Data Sync

```bash
# Run initial sync and start real-time sync
cd api
node scripts/sync-opensearch.js
```

### 5. Add Search Route to API

Update `api/index.js`:

```javascript
import searchRouter from './routes/search.js';

// Add after other routes
app.use('/api/search', searchRouter);
```

## Features Implemented

### 🔍 Advanced Search
- Full-text search across brands, models, descriptions
- Fuzzy matching for typo tolerance
- Multi-field boosting for relevance
- Phrase matching for exact searches

### 🏷️ Faceted Filtering
- Brand selection
- Price ranges
- Condition filters
- Classification categories
- Case materials
- Movement types

### 💡 Autocomplete
- Real-time suggestions as you type
- Brand and model completion
- Fuzzy matching support

### 🔗 Similar Watches
- Find watches similar to a specific model
- Based on brand, model, price range, and classifications

### 📊 Search Analytics
- Track popular searches
- Monitor click-through rates
- Trending watches based on activity

### ⚡ Performance Optimization
- Redis caching layer (5-minute cache)
- Real-time synchronization via MongoDB change streams
- Bulk indexing for initial data load

## API Endpoints

### Search Watches
```http
GET /api/search/watches?q=rolex&minPrice=5000&maxPrice=20000&brand=Rolex
```

**Parameters:**
- `q` - Search query text
- `brand` - Brand filter
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `condition` - Condition filter (array)
- `year` - Year filter
- `classifications` - Comma-separated classifications
- `sort` - Sort order (relevance, price_asc, price_desc, newest)
- `page` - Page number
- `limit` - Results per page

**Response:**
```json
{
  "watches": [...],
  "total": 150,
  "page": 1,
  "pages": 8,
  "facets": {
    "brands": [...],
    "priceRanges": [...],
    "conditions": [...]
  }
}
```

### Autocomplete Suggestions
```http
GET /api/search/suggestions?q=rol
```

**Response:**
```json
{
  "suggestions": [
    { "text": "Rolex", "type": "brand", "score": 0.95 },
    { "text": "Rolex Submariner", "type": "model", "score": 0.90 }
  ]
}
```

### Similar Watches
```http
GET /api/search/watches/:id/similar?limit=6
```

### Track Search Analytics
```http
POST /api/search/track
{
  "query": "rolex submariner",
  "resultsCount": 45,
  "clickedResult": "watch_id_123"
}
```

### Track Watch View
```http
POST /api/search/watches/:id/view
```

### Get Popular Searches
```http
GET /api/search/popular?limit=10
```

### Get Trending Watches
```http
GET /api/search/trending?limit=12
```

## Frontend Integration Example

```jsx
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';

function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const [debouncedQuery] = useDebounce(query, 300);

  // Search as you type
  useEffect(() => {
    if (debouncedQuery) {
      fetch(`/api/search/watches?q=${debouncedQuery}`)
        .then(res => res.json())
        .then(data => setResults(data.watches));
    }
  }, [debouncedQuery]);

  // Get suggestions
  useEffect(() => {
    if (query.length >= 2) {
      fetch(`/api/search/suggestions?q=${query}`)
        .then(res => res.json())
        .then(data => setSuggestions(data.suggestions));
    }
  }, [query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search luxury watches..."
      />
      {/* Render suggestions */}
      {/* Render results */}
    </div>
  );
}
```

## Monitoring & Management

### OpenSearch Dashboards
Access at: http://localhost:5601
- Username: `admin`
- Password: `Admin123!`

### Check Index Status
```bash
curl -k -u admin:Admin123! https://localhost:9200/watches/_stats
```

### View Index Mapping
```bash
curl -k -u admin:Admin123! https://localhost:9200/watches/_mapping
```

### Reindex All Data
```bash
cd api
node -e "import('./services/searchSync.js').then(m => m.reindexAllWatches())"
```

### Verify Sync Status
```bash
cd api
node -e "import('./services/searchSync.js').then(m => m.verifySyncStatus().then(console.log))"
```

## Troubleshooting

### OpenSearch Won't Start
```bash
# Check logs
docker-compose -f docker-compose.opensearch.yml logs opensearch

# Increase Docker memory (Docker Desktop > Settings > Resources)
# OpenSearch needs at least 4GB RAM
```

### Connection Refused
```bash
# Check if services are running
docker ps

# Restart services
docker-compose -f docker-compose.opensearch.yml restart
```

### Index Not Found
```bash
# Run initial sync
cd api
node scripts/sync-opensearch.js
```

### Sync Issues
```bash
# Check MongoDB connection
# Verify change streams are enabled (MongoDB 3.6+)
# Check OpenSearch connectivity
curl -k -u admin:Admin123! https://localhost:9200
```

## Performance Tips

1. **Index Optimization**
   - Run force merge periodically for better performance
   - Adjust refresh interval based on update frequency

2. **Caching Strategy**
   - Increase cache TTL for stable data
   - Use Redis clustering for high traffic

3. **Query Optimization**
   - Use filters instead of queries when possible
   - Limit aggregation bucket sizes
   - Use source filtering to reduce payload

## Security Considerations

1. **Production Deployment**
   - Change default passwords
   - Enable SSL certificate verification
   - Use environment variables for credentials
   - Implement API rate limiting

2. **Access Control**
   - Configure OpenSearch security policies
   - Use API keys instead of basic auth
   - Implement user-based search filtering

## Next Steps

1. **Implement Search UI Components**
   - Create SearchPage component
   - Add faceted filter sidebar
   - Implement infinite scroll or pagination

2. **Add Advanced Features**
   - Saved searches
   - Search alerts
   - Personalized recommendations
   - Search history

3. **Optimize for Production**
   - Set up OpenSearch cluster
   - Configure backup and recovery
   - Implement monitoring and alerting

## Resources

- [OpenSearch Documentation](https://opensearch.org/docs/)
- [OpenSearch JavaScript Client](https://opensearch.org/docs/latest/clients/javascript/)
- [OpenSearch Dashboards Guide](https://opensearch.org/docs/latest/dashboards/index/)
- [Redis Documentation](https://redis.io/documentation)

## License

OpenSearch is licensed under Apache 2.0, making it free to use for any purpose, including commercial use, without any licensing fees or restrictions.