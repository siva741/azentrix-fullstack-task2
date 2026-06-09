#!/usr/bin/env bash
# Deploy backend to Render using the Render API
# Requires: RENDER_API_KEY and RENDER_SERVICE_ID to be set in the environment

if [ -z "$RENDER_API_KEY" ] || [ -z "$RENDER_SERVICE_ID" ]; then
  echo "RENDER_API_KEY and RENDER_SERVICE_ID are required"
  exit 1
fi

echo "Triggering Render deploy for service $RENDER_SERVICE_ID..."

curl -X POST "https://api.render.com/deployments" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{ \"serviceId\": \"$RENDER_SERVICE_ID\" }"

echo "Done. Check Render dashboard for progress." 