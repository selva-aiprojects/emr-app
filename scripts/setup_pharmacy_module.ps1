# Pharmacy Module Setup Script (PowerShell)
# Executes all required migrations and loads sample data

Write-Host "╔══════════════════════════════════════════════════════════╗"
Write-Host "║     MedFlow EMR - Pharmacy Module Setup                 ║"
Write-Host "╚══════════════════════════════════════════════════════════╝"
Write-Host ""

# Configuration- Can be overridden with environment variables
$DB_USER = if ($env:DB_USER) { $env:DB_USER } else { "postgres" }
$DB_NAME = if ($env:DB_NAME) { $env:DB_NAME } else { "emr_db" }
$DB_HOST = if ($env:DB_HOST) { $env:DB_HOST } else { "localhost" }
$DB_PORT = if ($env:DB_PORT) { $env:DB_PORT } else { "5432" }

$env:PGUSER = $DB_USER
$env:PGDATABASE = $DB_NAME
$env:PGHOST = $DB_HOST
$env:PGPORT = $DB_PORT

Write-Host "Database Connection:"
Write-Host "  Host: $DB_HOST"
Write-Host "  Port: $DB_PORT"
Write-Host "  User: $DB_USER"
Write-Host "  Database: $DB_NAME"
Write-Host ""

# Check database connectivity
Write-Host "🔍 Testing database connection..."
$testQuery = psql -c "SELECT 1" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to connect to database!" -ForegroundColor Red
    Write-Host "Please check your credentials and try again."
    Write-Host ""
    Write-Host "You can set environment variables before running this script:"
    Write-Host '  $env:DB_USER="your_username"'
    Write-Host '  $env:DB_NAME="emr_db"'
    Write-Host '  $env:DB_HOST="localhost"'
    Write-Host '  $env:DB_PORT="5432"'
    Write-Host ""
    exit 1
}
Write-Host "✅ Database connection successful!" -ForegroundColor Green
Write-Host ""

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptDir

# Step 1: FHIR Compliance Migration
Write-Host "📋 Step 1/3: Running FHIR Compliance Migration..." -ForegroundColor Cyan
$migration1Path = Join-Path $projectRoot "database\migrations\005_fhir_compliance.sql"
if (Test-Path $migration1Path) {
    psql -f $migration1Path
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ FHIR compliance migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ FHIR compliance migration failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Migration file not found: $migration1Path" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 2: Pharmacy Module Migration
Write-Host "📋 Step 2/3: Running Pharmacy Module Migration..." -ForegroundColor Cyan
$migration2Path = Join-Path $projectRoot "database\migrations\006_pharmacy_module.sql"
if (Test-Path $migration2Path) {
    psql -f $migration2Path
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Pharmacy module migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Pharmacy module migration failed!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Migration file not found: $migration2Path" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Step 3: Load Sample Data
Write-Host "📋 Step 3/3: Loading Sample Pharmacy Data..." -ForegroundColor Cyan
$seedPath = Join-Path $projectRoot "database\pharmacy\seed_pharmacy_sample.sql"
if (Test-Path $seedPath) {
    psql -f $seedPath
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Sample data loaded successfully!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to load sample data!" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Seed file not found: $seedPath" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Verification
Write-Host "🔍 Verifying installation..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Drug Master Count:"
psql -c "SELECT COUNT(*) as drug_count FROM emr.drug_master;"

Write-Host ""
Write-Host "Drug Interactions Count:"
psql -c "SELECT COUNT(*) as interaction_count FROM emr.drug_interactions;"

Write-Host ""
Write-Host "Drug Batches Count:"
psql -c "SELECT COUNT(*) as batch_count FROM emr.drug_batches;"

Write-Host ""
Write-Host "Clinical Tables Status:"
psql -c "SELECT 
  'conditions' as table_name, COUNT(*) as row_count FROM emr.conditions
UNION ALL
SELECT 'procedures', COUNT(*) FROM emr.procedures
UNION ALL
SELECT 'observations', COUNT(*) FROM emr.observations
UNION ALL
SELECT 'diagnostic_reports', COUNT(*) FROM emr.diagnostic_reports;"

Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║     ✅ Pharmacy Module Setup Complete!                  ║"
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Start the pharmacy service: cd pharmacy-service; npm install; npm run dev"
Write-Host "2. Follow the testing guide: pharmacy-service\TESTING_GUIDE.md"
Write-Host ""
Write-Host "Sample drugs loaded include:" -ForegroundColor Cyan
psql -c "SELECT generic_name, brand_names[1] as brand_name, dosage_form 
         FROM emr.drug_master 
         WHERE tenant_id IS NULL 
         LIMIT 10;"
