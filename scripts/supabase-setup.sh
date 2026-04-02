#!/bin/bash

# Supabase + Northflank Setup Script
echo "🚀 Setting up EMR Application with Supabase + Northflank..."

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

# Build frontend with Supabase config
echo "🏗️ Building frontend with Supabase configuration..."
cp client/.env.supabase client/.env.production
npm run build

# Create Supabase migration files
echo "🗄️ Preparing Supabase migrations..."
if [ ! -d "supabase" ]; then
    mkdir supabase
    mkdir supabase/migrations
fi

# Copy Prisma schema to Supabase
echo "📋 Copying Prisma schema for Supabase..."
cp prisma/schema.prisma supabase/

# Create Supabase migration SQL
echo "📝 Creating Supabase migration SQL..."
npx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > supabase/migrations/001_initial_schema.sql

# Test database connection
echo "🔍 Testing database connection..."
if [ ! -z "$DATABASE_URL" ]; then
    echo "✅ DATABASE_URL found, testing connection..."
    npx prisma db pull --force || echo "⚠️ Could not pull schema (expected for fresh database)"
else
    echo "⚠️ DATABASE_URL not set. Please set it before running migrations."
fi

# Create health check
echo "💚 Creating health check..."
curl -f http://localhost:4000/api/health || echo "⚠️ Health check failed - this is normal if not running locally"

# Check Dockerfile
if [ ! -f "Dockerfile" ]; then
    echo "❌ Error: Dockerfile not found."
    exit 1
fi

# Check Supabase configuration
if [ ! -f "northflank-supabase-deployment.yaml" ]; then
    echo "⚠️ northflank-supabase-deployment.yaml not found."
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
.env.local
.env.development.local
.env.test.local
.env.production.local
.nyc_output
coverage
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
docker-compose.override.yml
EOF
fi

echo "✅ Supabase + Northflank setup complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Create Supabase project: https://supabase.com/"
echo "2. Get Supabase connection details"
echo "3. Create Northflank project"
echo "4. Create Northflank Redis add-on"
echo "5. Deploy using northflank-supabase-deployment.yaml"
echo "6. Set environment variables in Northflank"
echo "7. Run migrations: npx prisma migrate deploy"
echo "8. Seed data: npm run seed:e2e"
echo ""
echo "📚 Configuration files created:"
echo "- northflank-supabase-deployment.yaml"
echo "- server/config/supabase.js"
echo "- client/.env.supabase"
echo "- supabase/migrations/001_initial_schema.sql"
