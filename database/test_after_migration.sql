-- =====================================================
-- TEST AFTER FIRST MIGRATION
-- =====================================================
-- Run this after each successful migration to verify functionality

-- Step 1: Verify migration log
SELECT '=== MIGRATION LOG CHECK ===' as message;
SELECT 
    table_name,
    status,
    rows_moved,
    error_message,
    migration_time,
    CASE 
        WHEN status = 'MOVED' THEN '✅ Successfully moved'
        WHEN status = 'MERGED' THEN '✅ Successfully merged'
        WHEN status LIKE '%_FAILED' THEN '❌ Failed'
        ELSE '⏳ Unknown'
    END as result
FROM migration_log 
ORDER BY migration_time DESC;

-- Step 2: Verify table exists in correct schema
SELECT '=== SCHEMA VERIFICATION ===' as message;
DO $$
DECLARE
    last_migrated_table TEXT;
BEGIN
    -- Get the most recently migrated table
    SELECT table_name INTO last_migrated_table
    FROM migration_log 
    WHERE status IN ('MOVED', 'MERGED')
    ORDER BY migration_time DESC 
    LIMIT 1;
    
    IF last_migrated_table IS NOT NULL THEN
        RAISE NOTICE 'Checking table: %', last_migrated_table;
        
        -- Check if table exists in emr
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = last_migrated_table) THEN
            RAISE NOTICE '✅ Table exists in emr schema';
            
            -- Check row count
            DECLARE
                row_count BIGINT;
            BEGIN
                EXECUTE format('SELECT COUNT(*) FROM emr.%I', last_migrated_table) INTO row_count;
                RAISE NOTICE '✅ Table has % rows in emr schema', row_count;
            END;
            
            -- Check if table still exists in public (should not)
            IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = last_migrated_table) THEN
                RAISE NOTICE '⚠️ Table still exists in public schema - may need cleanup';
            ELSE
                RAISE NOTICE '✅ Table successfully removed from public schema';
            END IF;
            
        ELSE
            RAISE NOTICE '❌ Table not found in emr schema';
        END IF;
        
    ELSE
        RAISE NOTICE 'No successful migrations found';
    END IF;
END $$;

-- Step 3: Test basic database connectivity
SELECT '=== DATABASE CONNECTIVITY TEST ===' as message;
SELECT 
    'CONNECTIVITY_TEST' as test_type,
    current_database() as database_name,
    current_schema() as current_schema,
    version() as postgresql_version;

-- Step 4: Test application-critical tables
SELECT '=== CRITICAL TABLES CHECK ===' as message;
SELECT 
    'EMR_SCHEMA_TABLES' as check_type,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'emr'
  AND tablename NOT LIKE 'pg_%';

-- Check if core tables exist in emr
SELECT 
    'CORE_TABLES_STATUS' as check_type,
    tablename,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = pt.tablename) 
        THEN '✅ Available'
        ELSE '❌ Missing'
    END as status
FROM (
    SELECT 'tenants' as tablename UNION ALL
    SELECT 'users' UNION ALL
    SELECT 'patients' UNION ALL
    SELECT 'appointments' UNION ALL
    SELECT 'encounters'
) pt;

-- Step 5: Test sample queries (if data exists)
SELECT '=== SAMPLE QUERY TESTS ===' as message;
DO $$
BEGIN
    -- Test tenant query if table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = 'tenants') THEN
        RAISE NOTICE 'Testing tenant table access...';
        DECLARE
            tenant_count INTEGER;
        BEGIN
            EXECUTE 'SELECT COUNT(*) FROM tenants' INTO tenant_count;
            RAISE NOTICE '✅ Tenant query successful: % tenants found', tenant_count;
        EXCEPTION WHEN others THEN
            RAISE NOTICE '❌ Tenant query failed: %', SQLERRM;
        END;
    END IF;
    
    -- Test user query if table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = 'users') THEN
        RAISE NOTICE 'Testing user table access...';
        DECLARE
            user_count INTEGER;
        BEGIN
            EXECUTE 'SELECT COUNT(*) FROM users' INTO user_count;
            RAISE NOTICE '✅ User query successful: % users found', user_count;
        EXCEPTION WHEN others THEN
            RAISE NOTICE '❌ User query failed: %', SQLERRM;
        END;
    END IF;
    
    -- Test patient query if table exists
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = 'patients') THEN
        RAISE NOTICE 'Testing patient table access...';
        DECLARE
            patient_count INTEGER;
        BEGIN
            EXECUTE 'SELECT COUNT(*) FROM patients' INTO patient_count;
            RAISE NOTICE '✅ Patient query successful: % patients found', patient_count;
        EXCEPTION WHEN others THEN
            RAISE NOTICE '❌ Patient query failed: %', SQLERRM;
        END;
    END IF;
END $$;

-- Step 6: Check for any remaining public tables
SELECT '=== REMAINING PUBLIC TABLES ===' as message;
SELECT 
    tablename,
    (
        SELECT COUNT(*)::text 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = pt.tablename
    ) as columns,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = pt.tablename) 
        THEN '⚠️ Also in emr'
        ELSE '📋 Only in public'
    END as migration_status
FROM pg_tables pt
WHERE pt.schemaname = 'public'
  AND pt.tablename NOT LIKE 'pg_%'
  AND pt.tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
ORDER BY tablename;

-- Step 7: Generate next migration recommendation
SELECT '=== NEXT MIGRATION RECOMMENDATION ===' as message;
WITH next_candidate AS (
    SELECT 
        pt.tablename,
        (
            SELECT COUNT(*)::text 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = pt.tablename
        ) as column_count,
        EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'emr' 
              AND tablename = pt.tablename
        ) as exists_in_emr,
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM pg_tables 
                WHERE schemaname = 'emr' 
                  AND tablename = pt.tablename
            ) THEN 'MERGE_REQUIRED'
            ELSE 'SAFE_TO_MOVE'
        END as strategy
    FROM pg_tables pt
    WHERE pt.schemaname = 'public'
      AND pt.tablename NOT LIKE 'pg_%'
      AND pt.tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
      AND pt.tablename NOT IN (
          SELECT table_name FROM migration_log 
          WHERE status IN ('MOVED', 'MERGED')
      )
    ORDER BY 
        CASE 
            WHEN pt.tablename LIKE '%settings%' THEN 1
            WHEN pt.tablename LIKE '%config%' THEN 2
            WHEN pt.tablename LIKE '%feature%' THEN 3
            WHEN pt.tablename LIKE '%admin%' THEN 4
            ELSE 5
        END,
        pt.tablename
    LIMIT 1
)
SELECT 
    'NEXT_TABLE' as recommendation,
    tablename as next_table,
    strategy as migration_strategy,
    column_count,
    CASE 
        WHEN strategy = 'SAFE_TO_MOVE' THEN '🟢 Low Risk'
        ELSE '🟡 Medium Risk'
    END as risk_level
FROM next_candidate;

SELECT '=== TEST COMPLETE ===' as message;
\echo 'Review the results above and:'
\echo '1. If migration was successful, test the application'
\echo '2. If tests pass, proceed to next table'
\echo '3. If issues found, check migration log for errors'
