# Run Pharmacy Migrations on Neon
# Replace YOUR_NEON_CONNECTION_STRING with actual connection string from Neon console

$neonConnectionString = "postgresql://username:password@ep-xxx.region.aws.neon.tech/emr_db?sslmode=require"

Write-Host "Running FHIR Compliance Migration..." -ForegroundColor Cyan
& psql $neonConnectionString -f database\migrations\005_fhir_compliance.sql

Write-Host "Running Pharmacy Module Migration..." -ForegroundColor Cyan
& psql $neonConnectionString -f database\migrations\006_pharmacy_module.sql

Write-Host "Loading Sample Pharmacy Data..." -ForegroundColor Cyan
& psql $neonConnectionString -f database\pharmacy\seed_pharmacy_sample.sql

Write-Host "✅ All migrations completed!" -ForegroundColor Green
