#!/bin/bash
# Pharmacy Module Setup Script
# Executes all required migrations and loads sample data

echo "╔══════════════════════════════════════════════════════════╗"
echo "║     MedFlow EMR - Pharmacy Module Setup                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Configuration - Update these variables
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-emr_db}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

export PGUSER=$DB_USER
export PGDATABASE=$DB_NAME
export PGHOST=$DB_HOST
export PGPORT=$DB_PORT

echo "Database Connection:"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo ""

# Check database connectivity
echo "🔍 Testing database connection..."
if ! psql -c "SELECT 1" > /dev/null 2>&1; then
    echo "❌ Failed to connect to database!"
    echo "Please check your credentials and try again."
    echo ""
    echo "You can set environment variables before running this script:"
    echo "  export DB_USER=your_username"
    echo "  export DB_NAME=emr_db"
    echo "  export DB_HOST=localhost"
    echo "  export DB_PORT=5432"
    exit 1
fi
echo "✅ Database connection successful!"
echo ""

# Step 1: FHIR Compliance Migration
echo "📋 Step 1/3: Running FHIR Compliance Migration..."
if psql -f database/migrations/005_fhir_compliance.sql; then
    echo "✅ FHIR compliance migration completed successfully!"
else
    echo "❌ FHIR compliance migration failed!"
    exit 1
fi
echo ""

# Step 2: Pharmacy Module Migration
echo "📋 Step 2/3: Running Pharmacy Module Migration..."
if psql -f database/migrations/006_pharmacy_module.sql; then
    echo "✅ Pharmacy module migration completed successfully!"
else
    echo "❌ Pharmacy module migration failed!"
    exit 1
fi
echo ""

# Step 3: Load Sample Data
echo "📋 Step 3/3: Loading Sample Pharmacy Data..."
if psql -f database/pharmacy/seed_pharmacy_sample.sql; then
    echo "✅ Sample data loaded successfully!"
else
    echo "❌ Failed to load sample data!"
    exit 1
fi
echo ""

# Verification
echo "🔍 Verifying installation..."
echo ""

echo "Drug Master Count:"
psql -c "SELECT COUNT(*) as drug_count FROM emr.drug_master;"

echo ""
echo "Drug Interactions Count:"
psql -c "SELECT COUNT(*) as interaction_count FROM emr.drug_interactions;"

echo ""
echo "Drug Batches Count:"
psql -c "SELECT COUNT(*) as batch_count FROM emr.drug_batches;"

echo ""
echo "Clinical Tables Status:"
psql -c "SELECT 
  'conditions' as table_name, COUNT(*) as row_count FROM emr.conditions
UNION ALL
SELECT 'procedures', COUNT(*) FROM emr.procedures
UNION ALL
SELECT 'observations', COUNT(*) FROM emr.observations
UNION ALL
SELECT 'diagnostic_reports', COUNT(*) FROM emr.diagnostic_reports;"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║     ✅ Pharmacy Module Setup Complete!                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Next Steps:"
echo "1. Start the pharmacy service: cd pharmacy-service && npm install && npm run dev"
echo "2. Follow the testing guide: pharmacy-service/TESTING_GUIDE.md"
echo ""
echo "Sample drugs loaded include:"
psql -c "SELECT generic_name, brand_names[1] as brand_name, dosage_form 
         FROM emr.drug_master 
         WHERE tenant_id IS NULL 
         LIMIT 10;"
