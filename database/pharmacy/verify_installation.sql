-- ============================================================
-- MedFlow EMR- Pharmacy Module Verification Script
-- Run this in Neon SQL Editor to verify installation
-- ============================================================

-- 1. Check FHIR Clinical Tables
SELECT '📋 FHIR Clinical Tables' as category, 
       COUNT(DISTINCT table_name) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'emr' 
  AND table_name IN ('conditions', 'procedures', 'observations', 'diagnostic_reports', 'service_requests');

-- 2. Check Pharmacy Tables
SELECT '💊 Pharmacy Tables' as category,
       COUNT(DISTINCT table_name) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'emr' 
  AND (table_name LIKE 'drug%' 
       OR table_name LIKE '%prescription%' 
       OR table_name LIKE '%medication%' 
       OR table_name LIKE '%pharmacy%');

-- 3. Verify Drug Master Data
SELECT '💉 Drugs Loaded' as category, COUNT(*) as count 
FROM emr.drug_master 
WHERE tenant_id IS NULL;

-- 4. Verify Drug Interactions
SELECT '⚠️ Drug Interactions' as category, COUNT(*) as count 
FROM emr.drug_interactions;

-- 5. Verify Drug Batches
SELECT '📦 Drug Batches' as category, COUNT(*) as count 
FROM emr.drug_batches;

-- 6. List All New Tables Created
SELECT '🗂️ All EMR Tables' as category, table_name
FROM information_schema.tables 
WHERE table_schema = 'emr'
ORDER BY table_name;

-- 7. Sample Drugs Preview
SELECT 
  generic_name,
  brand_names[1] as brand_name,
  strength,
  dosage_form,
  rxnorm_code,
  schedule_type,
  high_alert_flag
FROM emr.drug_master
WHERE tenant_id IS NULL
ORDER BY generic_name
LIMIT 10;

-- 8. Check Drug Interactions Detail
SELECT 
  dm1.generic_name as drug_a,
  dm2.generic_name as drug_b,
  di.severity,
  LEFT(di.description, 80) as description_preview
FROM emr.drug_interactions di
JOIN emr.drug_master dm1 ON di.drug_a = dm1.drug_id
JOIN emr.drug_master dm2 ON di.drug_b = dm2.drug_id;

-- 9. Check Batch Expiry Dates
SELECT 
  dm.generic_name,
  db.batch_number,
  db.quantity_remaining,
  db.expiry_date,
  db.location
FROM emr.drug_batches db
JOIN emr.drug_master dm ON db.drug_id = dm.drug_id
ORDER BY db.expiry_date
LIMIT 10;

-- 10. Summary Statistics
SELECT 
  (SELECT COUNT(*) FROM emr.drug_master WHERE tenant_id IS NULL) as total_drugs,
  (SELECT COUNT(*) FROM emr.drug_interactions) as total_interactions,
  (SELECT COUNT(*) FROM emr.drug_batches) as total_batches,
  (SELECT COUNT(*) FROM emr.conditions) as conditions_count,
  (SELECT COUNT(*) FROM emr.procedures) as procedures_count,
  (SELECT COUNT(*) FROM emr.observations) as observations_count,
  (SELECT COUNT(*) FROM emr.diagnostic_reports) as diagnostic_reports_count,
  (SELECT COUNT(*) FROM emr.service_requests) as service_requests_count;
