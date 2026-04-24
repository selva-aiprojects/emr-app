#!/bin/bash

# Northflank Deployment Script
echo "🚀 Preparing EMR Application for Northflank Deployment..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run from project root."
    exit 1
fi

# Install production dependencies
echo "📦 Installing production dependencies..."
npm ci --only=production

# Install client dependencies
echo "📦 Installing client dependencies..."
cd client && npm ci --only=production && cd ..

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Build frontend
echo "🏗️ Building frontend..."
npm run build

# Run database migrations (if DATABASE_URL is set)
if [ ! -z "$DATABASE_URL" ]; then
    echo "🗄️ Running database migrations..."
    npx prisma migrate deploy
else
    echo "⚠️ DATABASE_URL not set. Skipping migrations."
fi

# Create health check
echo "💚 Creating health check..."
curl -f http://localhost:4000/api/health || echo "⚠️ Health check failed - this is normal if not running locally"

# Check Dockerfile
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found."
    exit 1
fi

# Check Northflank configuration
if [ ! -f "northflank-deployment.yaml" ]; then
    echo "⚠️ northflank-deployment.yaml not found."
fi

# Create .dockerignore if not exists
if [ ! -f ".dockerignore" ]; then
    echo "📝 Creating .dockerignore..."
    cat > .dockerignore << EOF
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
.cache
dist
.vscode
.idea
*.log
logs/
test/
docs/
scripts/
.gitignore
Dockerfile
docker-compose.yml
.nyc_output
coverage
.nyc_output
.cache
dist
.vscode
.idea
*.log
logs/
test/
docs/
scripts/
EOF
fi

echo "✅ Northflank deployment preparation complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Push to GitHub: git push origin main"
echo "2. Create Northflank project"
echo "3. Add PostgreSQL and Redis add-ons"
echo "4. Create container service"
echo "5. Create static site service"
echo "6. Configure environment variables"
echo ""
echo "📚 Documentation: docs/NORTHFLANK_DEPLOYMENT.md"
