#!/bin/bash

echo "🔍 Checking Cloud Run API logs..."
echo "📍 Service: api"
echo "🌍 Region: us-central1"
echo "📅 Project: juno-marketplace"
echo ""

# Stream live logs for JunoPay authentication debugging
echo "🔴 Streaming live API logs (press Ctrl+C to stop):"
export PATH=$PATH:~/google-cloud-sdk/bin
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=api" --format="value(timestamp,severity,textPayload)"