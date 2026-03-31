#!/bin/bash

# Render Deployment Script
echo "🚀 Preparing EMR Application for Render Deployment..."

# Install production dependencies
echo "📦 Installing dependencies..."
cd client && npm ci --only=production
cd ..

# Install server dependencies
npm ci --only=production

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate deploy

# Health check
echo "💚 Running health check..."
curl -f http://localhost:10000/api/health || echo "⚠️ Health check failed"

echo "✅ Deployment preparation complete!"
