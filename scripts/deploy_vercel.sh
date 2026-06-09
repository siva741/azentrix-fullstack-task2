#!/usr/bin/env bash
# Deploy frontend to Vercel using Vercel CLI
# Requires: VERCEL_TOKEN and VERCEL_ORG_ID (optional) and VERCEL_PROJECT_ID (or rely on git integration)

if [ -z "$VERCEL_TOKEN" ]; then
  echo "VERCEL_TOKEN is required"
  exit 1
fi

echo "Installing vercel..."
npm i -g vercel

echo "Deploying frontend (frontend/) to Vercel..."
cd frontend || exit 1
vercel --prod --token "$VERCEL_TOKEN"

echo "Done. Check Vercel dashboard for progress." 