-- =====================================================
-- CHECK ACTUAL DATABASE STATE - WHAT REALLY EXISTS
-- =====================================================
-- Let's see what's actually in your database

-- Step 1: Check what schemas exist
SELECT 
    'DATABASE_SCHEMAS' as check_type,
    schema_name
FROM information_schema.schemata 
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name;

-- Step 2: Check all tables in all schemas
SELECT 
    'ALL_TABLES' as check_type,
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
ORDER BY schemaname, tablename;

-- Step 3: Check specifically for public schema tables
SELECT 
    'PUBLIC_TABLES_DETAIL' as check_type,
    tablename,
    (
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = pt.tablename
    ) as column_count,
    (
        SELECT COUNT(*)::text
        FROM (
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = pt.tablename
        ) cols
    ) as has_columns
FROM pg_tables pt
WHERE pt.schemaname = 'public'
  AND pt.tablename NOT LIKE 'pg_%'
  AND pt.tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
ORDER BY tablename;

-- Step 4: Check specifically for emr schema tables
SELECT 
    'EMR_TABLES_DETAIL' as check_type,
    tablename,
    (
        SELECT COUNT(*) 
        FROM information_schema.columns 
        WHERE table_schema = 'emr' 
          AND table_name = pt.tablename
    ) as column_count,
    (
        SELECT COUNT(*)::text
        FROM (
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'emr' 
              AND table_name = pt.tablename
        ) cols
    ) as has_columns
FROM pg_tables pt
WHERE pt.schemaname = 'emr'
  AND pt.tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- Step 5: Check for any data in public tables
DO $$
DECLARE
    table_record RECORD;
    row_count BIGINT;
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS temp_public_counts (
        tablename TEXT,
        row_count BIGINT
    );
    
    DELETE FROM temp_public_counts;
    
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
          AND tablename NOT LIKE 'pg_%'
          AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
        ORDER BY tablename
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM public.%I', table_record.tablename) INTO row_count;
            INSERT INTO temp_public_counts (tablename, row_count) VALUES (table_record.tablename, row_count);
        EXCEPTION WHEN others THEN
            INSERT INTO temp_public_counts (tablename, row_count) VALUES (table_record.tablename, 0);
        END;
    END LOOP;
END $$;

SELECT 
    'PUBLIC_TABLE_DATA_COUNTS' as check_type,
    tablename,
    row_count
FROM temp_public_counts
ORDER BY tablename;

DROP TABLE IF EXISTS temp_public_counts;

-- Step 6: Check for any data in emr tables
DO $$
DECLARE
    table_record RECORD;
    row_count BIGINT;
BEGIN
    CREATE TEMP TABLE IF NOT EXISTS temp_emr_counts (
        tablename TEXT,
        row_count BIGINT
    );
    
    DELETE FROM temp_emr_counts;
    
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'emr'
          AND tablename NOT LIKE 'pg_%'
        ORDER BY tablename
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM emr.%I', table_record.tablename) INTO row_count;
            INSERT INTO temp_emr_counts (tablename, row_count) VALUES (table_record.tablename, row_count);
        EXCEPTION WHEN others THEN
            INSERT INTO temp_emr_counts (tablename, row_count) VALUES (table_record.tablename, 0);
        END;
    END LOOP;
END $$;

SELECT 
    'EMR_TABLE_DATA_COUNTS' as check_type,
    tablename,
    row_count
FROM temp_emr_counts
ORDER BY tablename;

DROP TABLE IF EXISTS temp_emr_counts;

-- Step 7: Summary comparison
SELECT 
    'SCHEMA_COMPARISON' as check_type,
    schemaname,
    COUNT(*) as table_count,
    SUM(
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = pt.schemaname 
                  AND table_name = pt.tablename
                LIMIT 1
            ) THEN 1
            ELSE 0
        END
    ) as tables_with_columns
FROM pg_tables pt
WHERE pt.schemaname IN ('public', 'emr')
  AND pt.tablename NOT LIKE 'pg_%'
  AND pt.tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
GROUP BY schemaname
ORDER BY schemaname;

-- Step 8: Check if there are any tables that exist in both schemas
WITH public_tables AS (
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT IN ('spatial_ref_sys', 'geometry_columns')
),
emr_tables AS (
    SELECT tablename FROM pg_tables WHERE schemaname = 'emr'
      AND tablename NOT LIKE 'pg_%'
)
SELECT 
    'DUPLICATE_TABLES' as check_type,
    pt.tablename,
    'EXISTS_IN_BOTH_SCHEMAS' as status
FROM public_tables pt
INNER JOIN emr_tables et ON pt.tablename = et.tablename
ORDER BY pt.tablename;

SELECT '=== ANALYSIS COMPLETE ===' as message;
