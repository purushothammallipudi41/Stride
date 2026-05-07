#!/bin/bash

# Vyx v2.0 - GCP Deployment Pulse 🛡️🏗️✨🚀⚡
# Usage: ./deploy-vyx-gcp.sh <PROJECT_ID>

PROJECT_ID=$1

if [ -z "$PROJECT_ID" ]; then
    echo "Usage: ./deploy-vyx-gcp.sh <PROJECT_ID>"
    exit 1
fi

echo "🚀 Starting Vyx v2.0 GCP Migration Rhythms..."

# 1. Enable GCP Social Services
gcloud services enable run.googleapis.com containerregistry.googleapis.com cloudbuild.googleapis.com

# 2. Build High-Fidelity Container
echo "🏗️ Building Vyx Pulse Container..."
gcloud builds submit --tag gcr.io/$PROJECT_ID/vyx-backend

# 3. Deploy to Cloud Run Heartbeat
echo "⚡ Launching Cloud Run Heartbeat..."
gcloud run deploy vyx-backend \
    --image gcr.io/$PROJECT_ID/vyx-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-env-vars="USE_FIREBASE=true,NODE_ENV=production"

echo "✅ Vyx v2.0 is pulsing on Google Cloud!"
