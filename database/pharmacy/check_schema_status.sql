-- ============================================================
-- Check Schema Status
-- Run this FIRST to see what exists
-- ============================================================

-- Check if emr schema exists
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = 'emr';

-- Check what tables exist in emr schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'emr'
ORDER BY table_name;

-- Check drug_master specifically
SELECT COUNT(*) as drug_count 
FROM drug_master 
WHERE tenant_id IS NULL;
