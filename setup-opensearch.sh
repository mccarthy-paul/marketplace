#!/bin/bash

# OpenSearch Setup Script for Juno Marketplace

echo "🔍 Setting up OpenSearch for Juno Marketplace..."

# Install OpenSearch client packages
echo "📦 Installing npm packages..."
cd api
pnpm add @opensearch-project/opensearch ioredis
cd ..

# Install frontend packages for search UI
echo "📦 Installing frontend packages..."
pnpm add lodash use-debounce

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p api/services
mkdir -p src/components/search

# Start OpenSearch with Docker Compose
echo "🐳 Starting OpenSearch services..."
docker-compose -f docker-compose.opensearch.yml up -d

# Wait for OpenSearch to be ready
echo "⏳ Waiting for OpenSearch to start..."
sleep 30

# Check if OpenSearch is running
echo "✅ Checking OpenSearch status..."
curl -k -u admin:Admin123! https://localhost:9200

echo "✨ OpenSearch setup complete!"
echo ""
echo "Next steps:"
echo "1. Update your .env file with:"
echo "   OPENSEARCH_URL=https://localhost:9200"
echo "   OPENSEARCH_USERNAME=admin"
echo "   OPENSEARCH_PASSWORD=Admin123!"
echo "   REDIS_HOST=localhost"
echo "   REDIS_PORT=6379"
echo ""
echo "2. Run initial data sync:"
echo "   node api/scripts/sync-opensearch.js"
echo ""
echo "3. Access OpenSearch Dashboards at:"
echo "   http://localhost:5601"
echo "   Username: admin"
echo "   Password: Admin123!"