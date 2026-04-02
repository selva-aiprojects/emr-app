-- =====================================================
-- ANALYZE PUBLIC SCHEMA USAGE IN APPLICATION
-- =====================================================
-- This script helps identify what's actually in public schema
-- and what the application is trying to access

-- Step 1: Check what tables exist in public schema
SELECT 
    'PUBLIC_TABLES' as analysis_type,
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Step 2: Check what tables exist in emr schema  
SELECT 
    'EMR_TABLES' as analysis_type,
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'emr'
ORDER BY tablename;

-- Step 3: Check for cross-schema foreign keys
SELECT 
    'CROSS_SCHEMA_FKS' as analysis_type,
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema != ccu.table_schema
ORDER BY tc.table_schema, tc.table_name;

-- Step 4: Check for missing tables that app expects
-- Based on common EMR table names, check if they exist in public but not emr
WITH public_tables AS (
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
),
emr_tables AS (
    SELECT tablename FROM pg_tables WHERE schemaname = 'emr'  
)
SELECT 
    'MISSING_IN_EMR' as analysis_type,
    pt.tablename
FROM public_tables pt
LEFT JOIN emr_tables et ON pt.tablename = et.tablename
WHERE et.tablename IS NULL
ORDER BY pt.tablename;

-- Step 5: Check for duplicate tables across schemas
WITH public_tables AS (
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
),
emr_tables AS (
    SELECT tablename FROM pg_tables WHERE schemaname = 'emr'  
)
SELECT 
    'DUPLICATE_TABLES' as analysis_type,
    pt.tablename
FROM public_tables pt
INNER JOIN emr_tables et ON pt.tablename = et.tablename
ORDER BY pt.tablename;

-- Step 6: Check row counts to understand data distribution
SELECT 
    'ROW_COUNTS' as analysis_type,
    schemaname,
    tablename,
    (
      SELECT COUNT(*) 
      FROM information_schema.columns 
      WHERE table_schema = pt.schemaname 
        AND table_name = pt.tablename
    ) as column_count
FROM pg_tables pt
WHERE schemaname IN ('public', 'emr')
ORDER BY schemaname, tablename;

-- Step 7: Generate migration recommendations
WITH public_tables AS (
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
),
emr_tables AS (
    SELECT tablename FROM pg_tables WHERE schemaname = 'emr'  
),
missing_in_emr AS (
    SELECT pt.tablename
    FROM public_tables pt
    LEFT JOIN emr_tables et ON pt.tablename = et.tablename
    WHERE et.tablename IS NULL
),
duplicates AS (
    SELECT pt.tablename
    FROM public_tables pt
    INNER JOIN emr_tables et ON pt.tablename = et.tablename
)
SELECT 
    'RECOMMENDATIONS' as analysis_type,
    'MOVE_TO_EMR' as action,
    tablename as target_table,
    'Safe to move' as recommendation
FROM missing_in_emr

UNION ALL

SELECT 
    'RECOMMENDATIONS' as analysis_type,
    'MERGE_DATA' as action,
    tablename as target_table,
    'Check for conflicts before merging' as recommendation  
FROM duplicates

UNION ALL

SELECT 
    'RECOMMENDATIONS' as analysis_type,
    'DELETE_FROM_PUBLIC' as action,
    tablename as target_table,
    'After successful migration' as recommendation
FROM (
    SELECT tablename FROM public_tables
    EXCEPT 
    SELECT tablename FROM missing_in_emr
    EXCEPT
    SELECT tablename FROM duplicates
) clean_tables;
