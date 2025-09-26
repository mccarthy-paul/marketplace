# Google Cloud Run Deployment Guide

## Prerequisites Checklist
- ✅ Google Cloud account created
- ✅ MongoDB Atlas cluster configured
- ✅ Project created in Google Cloud Console

## Step 1: Install Google Cloud CLI
```bash
# macOS installation
brew install google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

## Step 2: Authenticate and Configure
```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Set default region
gcloud config set run/region us-central1
```

## Step 3: Configure Environment Variables

1. Edit `.env.production` file with your actual values:
```env
PROJECT_ID=your-actual-project-id
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/juno-marketplace
JUNO_SECRET_KEY=your-juno-secret-key
SESSION_SECRET=generate-a-secure-random-string
```

2. Generate a secure session secret:
```bash
openssl rand -base64 32
```

## Step 4: Deploy Using the Script

### Option A: Automated Deployment Script
```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment
./deploy.sh
```

### Option B: Using Cloud Build (Recommended)
```bash
# One-command deployment using Cloud Build
gcloud builds submit --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1
```

### Option C: Manual Deployment
```bash
# 1. Build and push API
docker build -f Dockerfile.api -t gcr.io/YOUR_PROJECT_ID/api .
docker push gcr.io/YOUR_PROJECT_ID/api

# 2. Deploy API to Cloud Run
gcloud run deploy api \
  --image gcr.io/YOUR_PROJECT_ID/api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars "MONGODB_URI=your-mongodb-uri,SESSION_SECRET=your-secret"

# Repeat for frontend and admin apps
```

## Step 5: Post-Deployment Configuration

### Update Juno OAuth Settings
1. Get your API URL from deployment output
2. Go to Juno OAuth settings
3. Update redirect URI to: `https://api-xxxxx-uc.a.run.app/auth/junopay/callback`

### Update Environment Variables with Service URLs
After deployment, update the API with the correct CORS origins:

```bash
# Get the service URLs
API_URL=$(gcloud run services describe api --format 'value(status.url)')
FRONTEND_URL=$(gcloud run services describe frontend --format 'value(status.url)')
ADMIN_URL=$(gcloud run services describe admin --format 'value(status.url)')

# Update API with CORS configuration
gcloud run services update api \
  --update-env-vars "CORS_ORIGINS=$FRONTEND_URL,$ADMIN_URL"
```

## Step 6: Verify Deployment

1. **Test Frontend**: Visit the frontend URL in your browser
2. **Test Admin**: Visit the admin URL
3. **Test OAuth**: Try logging in with Juno
4. **Check API Health**: `curl https://api-xxxxx-uc.a.run.app/api/test`

## Monitoring & Logs

### View Logs
```bash
# API logs
gcloud run logs read --service=api

# Frontend logs
gcloud run logs read --service=frontend

# Admin logs
gcloud run logs read --service=admin

# Follow logs in real-time
gcloud run logs tail --service=api
```

### View Metrics
```bash
# Open Cloud Console
gcloud app browse
```

## Updating the Application

### Deploy New Version
```bash
# Using Cloud Build (recommended)
gcloud builds submit --config=cloudbuild.yaml

# Or using the deploy script
./deploy.sh
```

### Rollback if Needed
```bash
# List revisions
gcloud run revisions list --service=api

# Route traffic to previous revision
gcloud run services update-traffic api --to-revisions=api-00001-abc=100
```

## Custom Domain Setup (Optional)

1. **Verify domain ownership**
```bash
gcloud domains verify YOUR_DOMAIN.com
```

2. **Map domain to services**
```bash
gcloud run domain-mappings create \
  --service=frontend \
  --domain=YOUR_DOMAIN.com

gcloud run domain-mappings create \
  --service=api \
  --domain=api.YOUR_DOMAIN.com

gcloud run domain-mappings create \
  --service=admin \
  --domain=admin.YOUR_DOMAIN.com
```

3. **Update DNS records** with provided values

## Cost Management

### Monitor Costs
```bash
# View current billing
gcloud billing accounts list

# Set budget alerts in Cloud Console
```

### Optimize Costs
- Set max instances: `--max-instances=3`
- Set min instances to 0: `--min-instances=0`
- Reduce memory if possible: `--memory=256Mi`
- Use Cloud CDN for static assets

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**
```bash
# Enable required APIs
gcloud services enable run.googleapis.com containerregistry.googleapis.com
```

2. **MongoDB connection fails**
- Check Atlas IP whitelist includes 0.0.0.0/0
- Verify connection string format
- Check network connectivity

3. **OAuth redirect fails**
- Ensure Juno redirect URI matches exactly
- Check HTTPS is being used
- Verify session cookies settings

4. **High memory usage**
```bash
# Increase memory allocation
gcloud run services update api --memory=1Gi
```

## Security Best Practices

1. **Use Secret Manager for sensitive data**
```bash
# Create secret
echo -n "your-secret-value" | gcloud secrets create mongodb-uri --data-file=-

# Use in Cloud Run
gcloud run services update api \
  --set-secrets="MONGODB_URI=mongodb-uri:latest"
```

2. **Enable Cloud Armor** for DDoS protection
3. **Set up Identity-Aware Proxy** for admin access
4. **Regular security scans** with Cloud Security Scanner

## Support Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Google Cloud Support](https://cloud.google.com/support)