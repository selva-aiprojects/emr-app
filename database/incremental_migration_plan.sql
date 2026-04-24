-- =====================================================
-- INCREMENTAL MIGRATION PLAN - PUBLIC TO EMR
-- =====================================================
-- Safe, table-by-table migration approach

-- Step 0: Preparation
BEGIN;

-- Create migration log table
CREATE TABLE IF NOT EXISTS emr.migration_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(255) NOT NULL,
    old_schema VARCHAR(50) NOT NULL,
    new_schema VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    rows_moved INTEGER,
    error_message TEXT,
    migration_time TIMESTAMP DEFAULT NOW(),
    UNIQUE(table_name, old_schema, new_schema)
);

-- Step 1: Identify tables to migrate (run this first)
WITH migration_candidates AS (
    SELECT 
        pt.tablename,
        (
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_schema = 'pt.schemaname' 
              AND table_name = pt.tablename
        ) as column_count,
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
)
SELECT 
    tablename,
    column_count,
    exists_in_emr,
    CASE 
        WHEN exists_in_emr = '1' THEN 'MERGE_REQUIRED'
        ELSE 'SAFE_TO_MOVE'
    END as migration_strategy
FROM migration_candidates
ORDER BY tablename;

-- Step 2: Template for individual table migration
-- Copy this template for each table you want to migrate

-- Example: Migrate a specific table safely
DO $$
DECLARE
    table_to_migrate TEXT := 'your_table_name'; -- Change this for each table
    rows_count BIGINT;
    error_msg TEXT;
BEGIN
    -- Check if table exists in public
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = table_to_migrate) THEN
        RAISE NOTICE 'Table % does not exist in public schema', table_to_migrate;
        RETURN;
    END IF;
    
    -- Check if table already exists in emr
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'emr' AND tablename = table_to_migrate) THEN
        RAISE NOTICE 'Table % already exists in emr schema - need to merge data', table_to_migrate;
        
        -- Merge data approach
        BEGIN
            -- Get row count from public
            EXECUTE format('SELECT COUNT(*) FROM public.%I', table_to_migrate) INTO rows_count;
            
            -- Insert data into emr (avoiding duplicates)
            EXECUTE format('INSERT INTO emr.%I SELECT * FROM public.%I ON CONFLICT DO NOTHING', 
                          table_to_migrate, table_to_migrate);
            
            -- Log successful merge
            INSERT INTO emr.migration_log (table_name, old_schema, new_schema, status, rows_moved)
            VALUES (table_to_migrate, 'public', 'emr', 'MERGED', rows_count);
            
            RAISE NOTICE 'Successfully merged % rows from public.% to emr.%', rows_count, table_to_migrate, table_to_migrate;
            
        EXCEPTION WHEN others THEN
            error_msg := SQLERRM;
            INSERT INTO emr.migration_log (table_name, old_schema, new_schema, status, error_message)
            VALUES (table_to_migrate, 'public', 'emr', 'MERGE_FAILED', error_msg);
            RAISE EXCEPTION 'Failed to merge table %: %', table_to_migrate, error_msg;
        END;
        
    ELSE
        -- Safe to move approach
        BEGIN
            -- Get row count before moving
            EXECUTE format('SELECT COUNT(*) FROM public.%I', table_to_migrate) INTO rows_count;
            
            -- Move table to emr schema
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA emr', table_to_migrate);
            
            -- Log successful move
            INSERT INTO emr.migration_log (table_name, old_schema, new_schema, status, rows_moved)
            VALUES (table_to_migrate, 'public', 'emr', 'MOVED', rows_count);
            
            RAISE NOTICE 'Successfully moved table % (% rows) from public to emr', table_to_migrate, rows_count;
            
        EXCEPTION WHEN others THEN
            error_msg := SQLERRM;
            INSERT INTO emr.migration_log (table_name, old_schema, new_schema, status, error_message)
            VALUES (table_to_migrate, 'public', 'emr', 'MOVE_FAILED', error_msg);
            RAISE EXCEPTION 'Failed to move table %: %', table_to_migrate, error_msg;
        END;
    END IF;
END $$;

-- Step 3: Verification after each migration
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
ORDER BY ml.migration_time DESC;

-- Step 4: Post-migration cleanup (run after all tables are migrated)
-- Update sequences if needed
DO $$
DECLARE
    seq_record RECORD;
BEGIN
    FOR seq_record IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        BEGIN
            EXECUTE format('ALTER SEQUENCE public.%I SET SCHEMA emr', seq_record.sequence_name);
            RAISE NOTICE 'Moved sequence % to emr schema', seq_record.sequence_name;
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Failed to move sequence %: %', seq_record.sequence_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- Step 5: Final verification
-- Check public schema is clean (except system tables)
SELECT 
    'REMAINING_PUBLIC_TABLES' as check_type,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns');

-- Check emr schema has all tables
SELECT 
    'EMR_TABLE_COUNT' as check_type,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'emr';

COMMIT;

-- =====================================================
-- USAGE INSTRUCTIONS:
-- 
-- 1. Run the analysis query first to see what needs migration
-- 2. For each table, update the 'table_to_migrate' variable and run the migration block
-- 3. After each migration, run the verification query
-- 4. Test the application functionality after each successful migration
-- 5. Once all tables are migrated, run the cleanup steps
-- =====================================================
