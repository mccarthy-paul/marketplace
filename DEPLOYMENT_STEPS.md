# Quick Deployment Steps

## Step 1: Install Google Cloud CLI

### For macOS:
```bash
# Option A: Using Homebrew (easiest)
brew install --cask google-cloud-sdk

# Option B: Direct download
# Go to: https://cloud.google.com/sdk/docs/install-sdk#mac
# Download the package for macOS
```

## Step 2: Initialize Google Cloud

After installation, run these commands:

```bash
# 1. Initialize gcloud
gcloud init

# 2. Login (will open browser)
gcloud auth login

# 3. Set your project
gcloud config set project juno-marketplace

# 4. Set default region
gcloud config set run/region us-central1

# 5. Enable required APIs
gcloud services enable run.googleapis.com containerregistry.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com
```

## Step 3: Test Your MongoDB Connection

Before deploying, let's verify your MongoDB connection works:

```bash
# Test MongoDB connection locally
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://paulmccarthy_db_user:DXWMTEVQUrL5gad3@junomarketplace.ci9sfz3.mongodb.net?retryWrites=true&w=majority')
  .then(() => { console.log('✅ MongoDB Connected!'); process.exit(0); })
  .catch(err => { console.error('❌ MongoDB Error:', err.message); process.exit(1); });
"
```

## Step 4: Deploy to Cloud Run

### Option A: Using Cloud Build (Recommended - Single Command)
```bash
# This will build and deploy all three services
gcloud builds submit --config=cloudbuild.yaml --substitutions=_REGION=us-central1
```

### Option B: Using the Deploy Script
```bash
# Run the automated deployment script
./deploy.sh
```

### Option C: Manual Step-by-Step
```bash
# 1. Create Artifact Registry repository
gcloud artifacts repositories create juno-marketplace \
  --repository-format=docker \
  --location=us-central1 \
  --description="Juno Marketplace Docker images"

# 2. Configure Docker authentication
gcloud auth configure-docker us-central1-docker.pkg.dev

# 3. Build and deploy API
gcloud builds submit --tag us-central1-docker.pkg.dev/juno-marketplace/juno-marketplace/api:latest -f Dockerfile.api .

gcloud run deploy api \
  --image us-central1-docker.pkg.dev/juno-marketplace/juno-marketplace/api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8001 \
  --set-env-vars "MONGODB_URI=mongodb+srv://paulmccarthy_db_user:DXWMTEVQUrL5gad3@junomarketplace.ci9sfz3.mongodb.net?retryWrites=true&w=majority,JUNO_APPLICATION_ID=PaulsMarketplace-cafd2e7e,JUNO_SECRET_KEY=fd4b6008-f8c5-4c76-beae-8279bac9a91c,SESSION_SECRET=DfkdSLDQRvk9vHdJFiEyGLNGSSD7x+6OkzcB4PQZNYU=,NODE_ENV=production"

# 4. Build and deploy Frontend
gcloud builds submit --tag us-central1-docker.pkg.dev/juno-marketplace/juno-marketplace/frontend:latest -f Dockerfile.frontend .

gcloud run deploy frontend \
  --image us-central1-docker.pkg.dev/juno-marketplace/juno-marketplace/frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 80

# 5. Build and deploy Admin
gcloud builds submit --tag us-central1-docker.pkg.dev/juno-marketplace/juno-marketplace/admin:latest -f Dockerfile.admin .

gcloud run deploy admin \
  --image us-central1-docker.pkg.dev/juno-marketplace/juno-marketplace/admin:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8002
```

## Step 5: After Deployment

1. **Get your service URLs**:
```bash
gcloud run services list
```

2. **Update Juno OAuth**:
   - Copy your API URL (e.g., `https://api-xxxxx-uc.a.run.app`)
   - Update Juno redirect URI to: `https://api-xxxxx-uc.a.run.app/auth/junopay/callback`

3. **Update CORS on API**:
```bash
# Get the URLs
API_URL=$(gcloud run services describe api --region us-central1 --format 'value(status.url)')
FRONTEND_URL=$(gcloud run services describe frontend --region us-central1 --format 'value(status.url)')
ADMIN_URL=$(gcloud run services describe admin --region us-central1 --format 'value(status.url)')

# Update API with CORS
gcloud run services update api \
  --region us-central1 \
  --update-env-vars "CORS_ORIGINS=$FRONTEND_URL,$ADMIN_URL"
```

## Monitoring Your Deployment

```bash
# View logs
gcloud run logs tail --service=api --region=us-central1

# Check service status
gcloud run services describe api --region=us-central1
```

## Troubleshooting

If you get permission errors:
```bash
# Grant Cloud Build permissions
gcloud projects add-iam-policy-binding juno-marketplace \
  --member="serviceAccount:$(gcloud projects describe juno-marketplace --format='value(projectNumber)')@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"
```

## 🎯 Next Actions:
1. Install Google Cloud CLI using the commands above
2. Run `gcloud init` and login
3. Use Option A (Cloud Build) for the easiest deployment
4. Your marketplace will be live in about 10 minutes!