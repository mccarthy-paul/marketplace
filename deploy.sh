#!/bin/bash

# Google Cloud Run Deployment Script
# Make executable: chmod +x deploy.sh
# Usage: ./deploy.sh

set -e

echo "🚀 Starting deployment to Google Cloud Run..."

# Load environment variables
if [ ! -f .env.production ]; then
    echo "❌ Error: .env.production file not found"
    echo "Please create .env.production with your configuration"
    exit 1
fi

source .env.production

# Check if required variables are set
if [ -z "$PROJECT_ID" ] || [ -z "$REGION" ]; then
    echo "❌ Error: PROJECT_ID and REGION must be set in .env.production"
    exit 1
fi

echo "📦 Using project: $PROJECT_ID in region: $REGION"

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required Google Cloud APIs..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    containerregistry.googleapis.com \
    artifactregistry.googleapis.com

# Create Artifact Registry repository if it doesn't exist
echo "📦 Setting up Artifact Registry..."
gcloud artifacts repositories create juno-marketplace \
    --repository-format=docker \
    --location=$REGION \
    --description="Juno Marketplace Docker images" \
    2>/dev/null || echo "Repository already exists"

# Configure Docker to use gcloud for authentication
gcloud auth configure-docker ${REGION}-docker.pkg.dev

# Build and push images
echo "🏗️ Building Docker images..."

# API
echo "Building API image..."
docker build -f Dockerfile.api -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/juno-marketplace/api:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/juno-marketplace/api:latest

# Frontend
echo "Building Frontend image..."
docker build -f Dockerfile.frontend -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/juno-marketplace/frontend:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/juno-marketplace/frontend:latest

# Admin
echo "Building Admin image..."
docker build -f Dockerfile.admin -t ${REGION}-docker.pkg.dev/${PROJECT_ID}/juno-marketplace/admin:latest .
docker push ${REGION}-docker.pkg.dev/${PROJECT_ID}/juno-marketplace/admin:latest

echo "🚀 Deploying to Cloud Run..."

# Deploy API
echo "Deploying API..."
gcloud run deploy api \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/juno-marketplace/api:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8001 \
    --memory 512Mi \
    --max-instances 10 \
    --set-env-vars="MONGODB_URI=${MONGODB_URI},JUNO_APPLICATION_ID=${JUNO_APPLICATION_ID},JUNO_SECRET_KEY=${JUNO_SECRET_KEY},JUNOPAY_AUTHORIZE_URL=${JUNOPAY_AUTHORIZE_URL},JUNOPAY_TOKEN_URL=${JUNOPAY_TOKEN_URL},JUNOPAY_API_BASE_URL=${JUNOPAY_API_BASE_URL},SESSION_SECRET=${SESSION_SECRET},NODE_ENV=production"

# Get API URL
API_SERVICE_URL=$(gcloud run services describe api --platform managed --region $REGION --format 'value(status.url)')
echo "✅ API deployed at: $API_SERVICE_URL"

# Update frontend with API URL and deploy
echo "Deploying Frontend..."
gcloud run deploy frontend \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/juno-marketplace/frontend:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 80 \
    --memory 256Mi \
    --max-instances 10 \
    --set-env-vars="VITE_API_URL=${API_SERVICE_URL}"

# Get Frontend URL
FRONTEND_SERVICE_URL=$(gcloud run services describe frontend --platform managed --region $REGION --format 'value(status.url)')
echo "✅ Frontend deployed at: $FRONTEND_SERVICE_URL"

# Deploy Admin
echo "Deploying Admin..."
gcloud run deploy admin \
    --image ${REGION}-docker.pkg.dev/${PROJECT_ID}/juno-marketplace/admin:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8002 \
    --memory 256Mi \
    --max-instances 5 \
    --set-env-vars="VITE_API_URL=${API_SERVICE_URL}"

# Get Admin URL
ADMIN_SERVICE_URL=$(gcloud run services describe admin --platform managed --region $REGION --format 'value(status.url)')
echo "✅ Admin deployed at: $ADMIN_SERVICE_URL"

# Update API with CORS origins
echo "🔄 Updating API with CORS configuration..."
gcloud run services update api \
    --platform managed \
    --region $REGION \
    --update-env-vars="CORS_ORIGINS=${FRONTEND_SERVICE_URL},${ADMIN_SERVICE_URL},JUNO_REDIRECT_URI=${API_SERVICE_URL}/auth/junopay/callback"

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📝 Summary:"
echo "API URL: $API_SERVICE_URL"
echo "Frontend URL: $FRONTEND_SERVICE_URL"
echo "Admin URL: $ADMIN_SERVICE_URL"
echo ""
echo "⚠️  Important next steps:"
echo "1. Update Juno OAuth redirect URI to: ${API_SERVICE_URL}/auth/junopay/callback"
echo "2. Test the OAuth flow"
echo "3. Update any hardcoded URLs in your code"
echo "4. Configure custom domains if needed"
echo ""
echo "To view logs:"
echo "gcloud run logs read --service=api --region=$REGION"
echo "gcloud run logs read --service=frontend --region=$REGION"
echo "gcloud run logs read --service=admin --region=$REGION"