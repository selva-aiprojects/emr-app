-- =====================================================
-- COMPLETE MIGRATION WORKFLOW - PUBLIC TO EMR
-- =====================================================
-- Step 1: Analysis -> Step 2: Migration -> Step 3: Testing

-- =====================================================
-- STEP 1: COMPLETE DATABASE ANALYSIS
-- =====================================================

SELECT '=== STEP 1: DATABASE ANALYSIS ===' as step;

-- Check what schemas exist
SELECT 
    'DATABASE_SCHEMAS' as check_type,
    schema_name
FROM information_schema.schemata 
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name;

-- Check all tables in public schema
SELECT 
    'PUBLIC_TABLES' as check_type,
    tablename,
    (
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = pt.tablename
    ) as column_count
FROM pg_tables pt
WHERE pt.schemaname = 'public'
  AND pt.tablename NOT LIKE 'pg_%'
  AND pt.tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
ORDER BY tablename;

-- Get row counts for public tables
DO $$
DECLARE
    table_record RECORD;
    row_count BIGINT;
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS temp_analysis_results (
        tablename TEXT,
        row_count BIGINT,
        has_columns BOOLEAN
    );
    
    DELETE FROM temp_analysis_results;
    
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
          AND tablename NOT LIKE 'pg_%'
          AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
        ORDER BY tablename
    LOOP
        BEGIN
            -- Check if table has columns
            DECLARE
                col_count INTEGER;
            BEGIN
                SELECT COUNT(*) INTO col_count
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                  AND table_name = table_record.tablename;
                
                IF col_count > 0 THEN
                    EXECUTE format('SELECT COUNT(*) FROM public.%I', table_record.tablename) INTO row_count;
                    INSERT INTO temp_analysis_results (tablename, row_count, has_columns) 
                    VALUES (table_record.tablename, row_count, TRUE);
                ELSE
                    INSERT INTO temp_analysis_results (tablename, row_count, has_columns) 
                    VALUES (table_record.tablename, 0, FALSE);
                END IF;
            END;
        EXCEPTION WHEN others THEN
            INSERT INTO temp_analysis_results (tablename, row_count, has_columns) 
            VALUES (table_record.tablename, 0, FALSE);
        END;
    END LOOP;
END $$;

SELECT 
    'PUBLIC_TABLE_ANALYSIS' as check_type,
    tablename,
    row_count,
    has_columns,
    CASE 
        WHEN has_columns AND row_count > 0 THEN '🟢 NEEDS MIGRATION'
        WHEN has_columns AND row_count = 0 THEN '🟡 EMPTY TABLE'
        ELSE '🔴 NO COLUMNS'
    END as migration_priority
FROM temp_analysis_results
ORDER BY 
    CASE 
        WHEN has_columns AND row_count > 0 THEN 1
        WHEN has_columns AND row_count = 0 THEN 2
        ELSE 3
    END,
    tablename;

-- =====================================================
-- STEP 2: MIGRATE ALL PUBLIC TABLES TO EMR
-- =====================================================

SELECT '=== STEP 2: STARTING MIGRATION ===' as step;

-- Create migration log if not exists
CREATE TABLE IF NOT EXISTS emr.migration_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    old_schema VARCHAR(50) NOT NULL,
    new_schema VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    rows_moved BIGINT,
    error_message TEXT,
    migration_time TIMESTAMP DEFAULT NOW(),
    UNIQUE(table_name, old_schema, new_schema)
);

-- Migration function
CREATE OR REPLACE FUNCTION migrate_table_to_emr(table_to_migrate TEXT)
RETURNS TEXT AS $$
DECLARE
    rows_count BIGINT;
    error_msg TEXT;
    exists_in_emr BOOLEAN;
    column_count INTEGER;
    result_msg TEXT;
BEGIN
    RAISE NOTICE '=== MIGRATING TABLE: % ===', table_to_migrate;
    
    -- Check if table exists in public
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = table_to_migrate) THEN
        result_msg := format('Table %s does not exist in public schema', table_to_migrate);
        RAISE NOTICE '%', result_msg;
        RETURN result_msg;
    END IF;
    
    -- Check if table has columns
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = table_to_migrate;
    
    IF column_count = 0 THEN
        result_msg := format('Table %s has no columns - skipping', table_to_migrate);
        RAISE NOTICE '%', result_msg;
        RETURN result_msg;
    END IF;
    
    -- Get row count before migration
    BEGIN
        EXECUTE format('SELECT COUNT(*) FROM public.%I', table_to_migrate) INTO rows_count;
    EXCEPTION WHEN others THEN
        rows_count := 0;
    END;
    
    -- Check if table already exists in emr
    EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = table_to_migrate) INTO exists_in_emr;
    
    IF exists_in_emr THEN
        RAISE NOTICE 'Table % already exists in emr schema - merging data', table_to_migrate;
        
        -- Merge data approach
        BEGIN
            -- Insert data into emr (avoiding duplicates)
            EXECUTE format('INSERT INTO emr.%I SELECT * FROM public.%I ON CONFLICT DO NOTHING', 
                          table_to_migrate, table_to_migrate);
            
            -- Log successful merge
            INSERT INTO emr.migration_log (table_name, old_schema, new_schema, status, rows_moved)
            VALUES (table_to_migrate, 'public', 'emr', 'MERGED', rows_count);
            
            -- Drop original table
            EXECUTE format('DROP TABLE public.%I CASCADE', table_to_migrate);
            
            result_msg := format('✅ Successfully merged %s (% rows) from public to emr', table_to_migrate, rows_count);
            RAISE NOTICE '%', result_msg;
            
        EXCEPTION WHEN others THEN
            error_msg := SQLERRM;
            INSERT INTO emr.migration_log (table_name, old_schema, new_schema, status, error_message)
            VALUES (table_to_migrate, 'public', 'emr', 'MERGE_FAILED', error_msg);
            result_msg := format('❌ Failed to merge table %s: %s', table_to_migrate, error_msg);
            RAISE NOTICE '%', result_msg;
        END;
        
    ELSE
        RAISE NOTICE 'Table % does not exist in emr - moving safely', table_to_migrate;
        
        -- Safe to move approach
        BEGIN
            -- Move table to emr schema
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA emr', table_to_migrate);
            
            -- Log successful move
            INSERT INTO emr.migration_log (table_name, old_schema, new_schema, status, rows_moved)
            VALUES (table_to_migrate, 'public', 'emr', 'MOVED', rows_count);
            
            result_msg := format('✅ Successfully moved table %s (% rows) from public to emr', table_to_migrate, rows_count);
            RAISE NOTICE '%', result_msg;
            
        EXCEPTION WHEN others THEN
            error_msg := SQLERRM;
            INSERT INTO emr.migration_log (table_name, old_schema, new_schema, status, error_message)
            VALUES (table_to_migrate, 'public', 'emr', 'MOVE_FAILED', error_msg);
            result_msg := format('❌ Failed to move table %s: %s', table_to_migrate, error_msg);
            RAISE NOTICE '%', result_msg;
        END;
    END IF;
    
    RETURN result_msg;
END;
$$ LANGUAGE plpgsql;

-- Migrate all tables from public to emr
DO $$
DECLARE
    table_record RECORD;
    migration_result TEXT;
    total_migrated INTEGER := 0;
    total_failed INTEGER := 0;
BEGIN
    RAISE NOTICE '=== STARTING BULK MIGRATION ===';
    
    FOR table_record IN 
        SELECT tablename, row_count, has_columns
        FROM temp_analysis_results
        WHERE has_columns = TRUE
        ORDER BY 
            CASE 
                WHEN row_count > 0 THEN 1  -- Migrate tables with data first
                ELSE 2  -- Then empty tables
            END,
            tablename
    LOOP
        migration_result := migrate_table_to_emr(table_record.tablename);
        
        IF migration_result LIKE '✅%' THEN
            total_migrated := total_migrated + 1;
        ELSE
            total_failed := total_failed + 1;
        END IF;
        
        RAISE NOTICE 'Migration result: %', migration_result;
    END LOOP;
    
    RAISE NOTICE '=== MIGRATION SUMMARY ===';
    RAISE NOTICE 'Successfully migrated: % tables', total_migrated;
    RAISE NOTICE 'Failed migrations: % tables', total_failed;
END $$;

DROP TABLE IF EXISTS temp_analysis_results;

-- =====================================================
-- STEP 3: POST-MIGRATION VERIFICATION
-- =====================================================

SELECT '=== STEP 3: POST-MIGRATION VERIFICATION ===' as step;

-- Show migration results
SELECT 
    'MIGRATION_RESULTS' as check_type,
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
ORDER BY migration_time DESC;

-- Check if any tables remain in public
SELECT 
    'REMAINING_PUBLIC_TABLES' as check_type,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns');

-- Verify emr schema has all tables
SELECT 
    'EMR_SCHEMA_TABLES' as check_type,
    COUNT(*) as table_count
FROM pg_tables 
WHERE schemaname = 'emr'
  AND tablename NOT LIKE 'pg_%';

-- Test basic queries on key tables
DO $$
DECLARE
    test_result TEXT;
BEGIN
    RAISE NOTICE '=== TESTING KEY TABLES ===';
    
    -- Test tenants table
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = 'tenants') THEN
        BEGIN
            EXECUTE 'SELECT COUNT(*) FROM emr.tenants';
            RAISE NOTICE '✅ Tenants table accessible';
        EXCEPTION WHEN others THEN
            RAISE NOTICE '❌ Tenants table error: %', SQLERRM;
        END;
    END IF;
    
    -- Test users table
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = 'users') THEN
        BEGIN
            EXECUTE 'SELECT COUNT(*) FROM emr.users';
            RAISE NOTICE '✅ Users table accessible';
        EXCEPTION WHEN others THEN
            RAISE NOTICE '❌ Users table error: %', SQLERRM;
        END;
    END IF;
    
    -- Test patients table
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = 'patients') THEN
        BEGIN
            EXECUTE 'SELECT COUNT(*) FROM emr.patients';
            RAISE NOTICE '✅ Patients table accessible';
        EXCEPTION WHEN others THEN
            RAISE NOTICE '❌ Patients table error: %', SQLERRM;
        END;
    END IF;
END $$;

-- =====================================================
-- STEP 4: APPLICATION TESTING INSTRUCTIONS
-- =====================================================

SELECT '=== STEP 4: APPLICATION TESTING INSTRUCTIONS ===' as step;

SELECT 'MIGRATION COMPLETED' as status;
SELECT 'Next steps for testing:' as instructions;
SELECT '1. Start your EMR application server' as step1;
SELECT '2. Test login functionality' as step2;
SELECT '3. Test dashboard access' as step3;
SELECT '4. Test patient management' as step4;
SELECT '5. Test appointment booking' as step5;
SELECT '6. Test billing features' as step6;
SELECT '7. Test pharmacy features' as step7;

SELECT '=== MIGRATION WORKFLOW COMPLETE ===' as final_message;
