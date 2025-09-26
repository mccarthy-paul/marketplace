#!/bin/bash

# Monitor deployment progress

echo "🔍 Monitoring your deployment..."
echo ""

# Export PATH if needed
export PATH=$PATH:~/google-cloud-sdk/bin

# Get the latest build
BUILD_ID=$(gcloud builds list --limit=1 --format="value(id)")

if [ -z "$BUILD_ID" ]; then
    echo "No build found. Starting a new deployment..."
    gcloud builds submit --config=cloudbuild.yaml --substitutions=_REGION=us-central1
else
    echo "📦 Build ID: $BUILD_ID"
    echo ""
    echo "Following build logs..."
    echo "---"

    # Stream the build logs
    gcloud builds log $BUILD_ID --stream

    echo ""
    echo "---"
    echo "✅ Build complete!"
    echo ""

    # Get service URLs
    echo "🌐 Your services are deployed at:"
    echo ""

    API_URL=$(gcloud run services describe api --region=us-central1 --format='value(status.url)' 2>/dev/null)
    FRONTEND_URL=$(gcloud run services describe frontend --region=us-central1 --format='value(status.url)' 2>/dev/null)
    ADMIN_URL=$(gcloud run services describe admin --region=us-central1 --format='value(status.url)' 2>/dev/null)

    if [ ! -z "$API_URL" ]; then
        echo "🔧 API:      $API_URL"
    fi

    if [ ! -z "$FRONTEND_URL" ]; then
        echo "🌟 Frontend: $FRONTEND_URL"
    fi

    if [ ! -z "$ADMIN_URL" ]; then
        echo "👨‍💼 Admin:    $ADMIN_URL"
    fi

    echo ""
    echo "📝 Next steps:"
    echo "1. Update Juno OAuth redirect URI to: ${API_URL}/auth/junopay/callback"
    echo "2. Test your marketplace at: $FRONTEND_URL"
fi