#!/bin/bash

# =====================================================
# COMPLETE MIGRATION SCRIPT - PUBLIC TO EMR SCHEMA
# =====================================================
# This script runs the complete migration workflow

echo "🚀 Starting Complete Migration: Public to EMR Schema"
echo "=================================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable not set"
    echo "Please set DATABASE_URL and run again"
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Step 1: Run complete migration workflow
echo "📊 Step 1: Running Complete Migration Workflow..."
echo "--------------------------------------------------"

if psql "$DATABASE_URL" -f database/complete_migration_workflow.sql; then
    echo "✅ Migration workflow completed successfully"
else
    echo "❌ Migration workflow failed"
    echo "Please check the error messages above"
    exit 1
fi

echo ""
echo "🧪 Step 2: Running Application Test Suite..."
echo "--------------------------------------------------"

if psql "$DATABASE_URL" -f database/application_test_suite.sql; then
    echo "✅ Application test suite completed"
else
    echo "❌ Application test suite failed"
    echo "Please check the error messages above"
    exit 1
fi

echo ""
echo "🎯 Step 3: Application Testing Instructions..."
echo "--------------------------------------------------"

echo "Migration completed! Now test your application:"
echo ""
echo "1. Start your EMR application:"
echo "   cd server && npm start"
echo "   or"
echo "   node server/index.js"
echo ""
echo "2. Open your browser and navigate to:"
echo "   http://localhost:4000"
echo ""
echo "3. Test these critical features:"
echo "   ✅ Login functionality"
echo "   ✅ Dashboard access"
echo "   ✅ Patient management"
echo "   ✅ Appointment scheduling"
echo "   ✅ Billing/invoicing"
echo "   ✅ Pharmacy features"
echo "   ✅ User management"
echo "   ✅ Tenant settings"
echo ""
echo "4. If any features fail:"
echo "   - Check the migration logs: SELECT * FROM emr.migration_log;"
echo "   - Check test results: SELECT * FROM emr.test_results;"
echo "   - Review error messages in the console"
echo ""

echo "🎉 Migration Complete!"
echo "====================="
echo "Your database has been migrated from public to emr schema."
echo "All tables should now be accessible through your application."
echo ""
echo "If you encounter any issues, run this command to see details:"
echo "psql \$DATABASE_URL -c \"SELECT * FROM emr.migration_log ORDER BY migration_time DESC;\""
