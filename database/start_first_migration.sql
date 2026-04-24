-- =====================================================
-- START FIRST MIGRATION - ANALYSIS & FIRST TABLE
-- =====================================================
-- Let's begin with a safe, simple table

-- Step 1: Run complete analysis first
SELECT '=== RUNNING COMPLETE ANALYSIS ===' as message;

-- Show current state
SELECT 
    'CURRENT_STATE' as step,
    schemaname,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname IN ('public', 'emr')
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
GROUP BY schemaname
ORDER BY schemaname;

-- List all tables in public schema
SELECT 
    'PUBLIC_TABLES' as step,
    tablename,
    (
        SELECT COUNT(*)::text 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = pt.tablename
    ) as columns,
    (
        SELECT COUNT(*)::text 
        FROM pg_tables pt2 
        WHERE pt2.schemaname = 'emr' 
          AND pt2.tablename = pt.tablename
    ) as exists_in_emr
FROM pg_tables pt
WHERE pt.schemaname = 'public'
  AND pt.tablename NOT LIKE 'pg_%'
  AND pt.tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
ORDER BY tablename;

-- Step 2: Choose first safe table to migrate
-- Let's start with a simple configuration table if it exists
DO $$
DECLARE
    first_table TEXT;
    table_exists BOOLEAN := FALSE;
BEGIN
    -- Look for a simple, safe table to start with
    -- Priority: admin_settings, feature_flags, or similar config tables
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_settings') THEN
        first_table := 'admin_settings';
        table_exists := TRUE;
    ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tenant_features') THEN
        first_table := 'tenant_features';
        table_exists := TRUE;
    ELSIF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'global_kill_switches') THEN
        first_table := 'global_kill_switches';
        table_exists := TRUE;
    ELSE
        -- Pick the first available table
        SELECT tablename INTO first_table
        FROM pg_tables 
        WHERE schemaname = 'public'
          AND tablename NOT LIKE 'pg_%'
          AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
        LIMIT 1;
        
        IF first_table IS NOT NULL THEN
            table_exists := TRUE;
        END IF;
    END IF;
    
    IF table_exists THEN
        RAISE NOTICE '=== FIRST TABLE SELECTED: % ===', first_table;
        
        -- Show table details before migration
        RAISE NOTICE 'Table Analysis:';
        EXECUTE format('SELECT COUNT(*) as row_count FROM public.%I', first_table);
        
        -- Check if it exists in emr
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = first_table) THEN
            RAISE NOTICE 'Table also exists in emr schema - will need to merge data';
        ELSE
            RAISE NOTICE 'Table does not exist in emr schema - safe to move';
        END IF;
        
        -- Perform the migration
        SELECT migrate_single_table(first_table);
        
    ELSE
        RAISE NOTICE 'No tables found in public schema to migrate';
    END IF;
END $$;

-- Migration function
CREATE OR REPLACE FUNCTION migrate_single_table(table_to_migrate TEXT)
RETURNS VOID AS $$
DECLARE
    rows_count BIGINT;
    error_msg TEXT;
    exists_in_emr BOOLEAN;
BEGIN
    RAISE NOTICE '=== STARTING MIGRATION FOR: % ===', table_to_migrate;
    
    -- Check if table exists in public
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = table_to_migrate) THEN
        RAISE NOTICE 'Table % does not exist in public schema', table_to_migrate;
        RETURN;
    END IF;
    
    -- Check if table already exists in emr
    EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = table_to_migrate) INTO exists_in_emr;
    
    IF exists_in_emr THEN
        RAISE NOTICE 'Table % already exists in emr schema - merging data', table_to_migrate;
        
        -- Merge data approach
        BEGIN
            -- Get row count from public
            EXECUTE format('SELECT COUNT(*) FROM public.%I', table_to_migrate) INTO rows_count;
            
            -- Insert data into emr (avoiding duplicates based on primary key)
            EXECUTE format('INSERT INTO emr.%I SELECT * FROM public.%I ON CONFLICT DO NOTHING', 
                          table_to_migrate, table_to_migrate);
            
            -- Log successful merge
            INSERT INTO emr.migration_log (table_name, old_schema, new_schema, status, rows_moved)
            VALUES (table_to_migrate, 'public', 'emr', 'MERGED', rows_count);
            
            RAISE NOTICE '✅ Successfully merged % rows from public.% to emr.%', rows_count, table_to_migrate, table_to_migrate;
            
        EXCEPTION WHEN others THEN
            error_msg := SQLERRM;
            INSERT INTO emr.migration_log (table_name, old_schema, new_schema, status, error_message)
            VALUES (table_to_migrate, 'public', 'emr', 'MERGE_FAILED', error_msg);
            RAISE EXCEPTION '❌ Failed to merge table %: %', table_to_migrate, error_msg;
        END;
        
    ELSE
        RAISE NOTICE 'Table % does not exist in emr - moving safely', table_to_migrate;
        
        -- Safe to move approach
        BEGIN
            -- Get row count before moving
            EXECUTE format('SELECT COUNT(*) FROM public.%I', table_to_migrate) INTO rows_count;
            
            -- Move table to emr schema
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA emr', table_to_migrate);
            
            -- Log successful move
            INSERT INTO emr.migration_log (table_name, old_schema, new_schema, status, rows_moved)
            VALUES (table_to_migrate, 'public', 'emr', 'MOVED', rows_count);
            
            RAISE NOTICE '✅ Successfully moved table % (% rows) from public to emr', table_to_migrate, rows_count;
            
        EXCEPTION WHEN others THEN
            error_msg := SQLERRM;
            INSERT INTO emr.migration_log (table_name, old_schema, new_schema, status, error_message)
            VALUES (table_to_migrate, 'public', 'emr', 'MOVE_FAILED', error_msg);
            RAISE EXCEPTION '❌ Failed to move table %: %', table_to_migrate, error_msg;
        END;
    END IF;
    
    -- Verify migration success
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = table_to_migrate) THEN
        RAISE NOTICE '✅ Migration verified: table no longer exists in public schema';
    ELSE
        RAISE NOTICE '⚠️ Migration warning: table still exists in public schema';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = table_to_migrate) THEN
        EXECUTE format('SELECT COUNT(*) FROM emr.%I', table_to_migrate) INTO rows_count;
        RAISE NOTICE '✅ Migration verified: table exists in emr schema with % rows', rows_count;
    ELSE
        RAISE NOTICE '❌ Migration failed: table not found in emr schema';
    END IF;
    
END;
$$ LANGUAGE plpgsql;

-- Step 3: Show migration results
SELECT '=== MIGRATION RESULTS ===' as message;
SELECT 
    ml.table_name,
    ml.status,
    ml.rows_moved,
    ml.error_message,
    ml.migration_time,
    CASE 
        WHEN ml.status = 'MOVED' THEN '✅ Success'
        WHEN ml.status = 'MERGED' THEN '✅ Merged'
        WHEN ml.status LIKE '%_FAILED' THEN '❌ Failed'
        ELSE '⏳ Pending'
    END as status_icon
FROM emr.migration_log ml
ORDER BY ml.migration_time DESC
LIMIT 10;

-- Step 4: Show current schema state
SELECT '=== CURRENT SCHEMA STATE ===' as message;
SELECT 
    schemaname,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname IN ('public', 'emr')
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
GROUP BY schemaname
ORDER BY schemaname;

SELECT '=== MIGRATION COMPLETE ===' as message;
SELECT 'Next steps:' as next_steps;
SELECT '1. Test application functionality' as step1;
SELECT '2. If successful, run next table migration' as step2;
SELECT '3. Continue table by table until complete' as step3;
