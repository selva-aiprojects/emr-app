-- =====================================================
-- MIGRATE NEXT TABLE - TEMPLATE FOR REPEAT USE
-- =====================================================
-- Use this template for each subsequent table migration

-- Step 1: Choose your next table
-- Update this variable for each migration
\set table_name 'your_next_table_name'

-- Step 2: Show current state before migration
\echo '=== BEFORE MIGRATION ==='
SELECT 
    'BEFORE' as state,
    schemaname,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname IN ('public', 'emr')
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
GROUP BY schemaname
ORDER BY schemaname;

-- Show table details
DO $$
DECLARE
    target_table TEXT := :'table_name';
    row_count BIGINT;
    column_count INTEGER;
    exists_in_emr BOOLEAN;
BEGIN
    RAISE NOTICE '=== ANALYZING TABLE: % ===', target_table;
    
    -- Check if table exists in public
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = target_table) THEN
        RAISE NOTICE '❌ Table % does not exist in public schema', target_table;
        RETURN;
    END IF;
    
    -- Get table info
    EXECUTE format('SELECT COUNT(*) FROM public.%I', target_table) INTO row_count;
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = target_table;
    
    RAISE NOTICE '📊 Table has % rows and % columns', row_count, column_count;
    
    -- Check if exists in emr
    EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = target_table) INTO exists_in_emr;
    
    IF exists_in_emr THEN
        RAISE NOTICE '⚠️ Table also exists in emr schema - will merge data';
        
        -- Show row counts in both schemas
        DECLARE
            emr_rows BIGINT;
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM emr.%I', target_table) INTO emr_rows;
            RAISE NOTICE '📊 EMR table currently has % rows', emr_rows;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Could not count rows in emr table';
        END;
    ELSE
        RAISE NOTICE '✅ Table does not exist in emr schema - safe to move';
    END IF;
END $$;

-- Step 3: Perform the migration
\echo '=== PERFORMING MIGRATION ==='
SELECT migrate_single_table(:'table_name');

-- Step 4: Show results after migration
\echo '=== AFTER MIGRATION ==='
SELECT 
    'AFTER' as state,
    schemaname,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname IN ('public', 'emr')
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
GROUP BY schemaname
ORDER BY schemaname;

-- Verify specific table migration
DO $$
DECLARE
    target_table TEXT := :'table_name';
    public_exists BOOLEAN;
    emr_exists BOOLEAN;
    emr_rows BIGINT;
BEGIN
    RAISE NOTICE '=== VERIFYING MIGRATION FOR: % ===', target_table;
    
    -- Check schemas
    EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = target_table) INTO public_exists;
    EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = target_table) INTO emr_exists;
    
    IF emr_exists THEN
        EXECUTE format('SELECT COUNT(*) FROM emr.%I', target_table) INTO emr_rows;
        RAISE NOTICE '✅ Table exists in emr schema with % rows', emr_rows;
        
        IF NOT public_exists THEN
            RAISE NOTICE '✅ Table successfully removed from public schema';
        ELSE
            RAISE NOTICE '⚠️ Table still exists in public schema';
        END IF;
    ELSE
        RAISE NOTICE '❌ Table not found in emr schema';
    END IF;
END $$;

-- Step 5: Show migration log
\echo '=== MIGRATION LOG ==='
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
FROM emr.migration_log 
WHERE table_name = :'table_name'
ORDER BY migration_time DESC;

-- Step 6: Show remaining tables
\echo '=== REMAINING TABLES IN PUBLIC ==='
SELECT 
    tablename,
    (
        SELECT COUNT(*)::text 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = pt.tablename
    ) as columns
FROM pg_tables pt
WHERE pt.schemaname = 'public'
  AND pt.tablename NOT LIKE 'pg_%'
  AND pt.tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
  AND pt.tablename NOT IN (
      SELECT table_name FROM emr.migration_log 
      WHERE status IN ('MOVED', 'MERGED')
  )
ORDER BY tablename;

\echo '=== MIGRATION COMPLETE ==='
\echo 'Next steps:'
\echo '1. Run test_after_migration.sql'
\echo '2. Test application functionality'
\echo '3. If successful, update table_name and run this script again'
\echo ''
\echo 'Usage: psql $DATABASE_URL -f migrate_next_table.sql -v table_name=your_table_name'
