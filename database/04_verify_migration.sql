-- =====================================================
-- STEP 4: VERIFY MIGRATION SUCCESS
-- =====================================================
-- Run this to confirm everything moved correctly

-- Check emr schema contents
RAISE NOTICE '=== EMR SCHEMA CONTENTS ===';

-- Tables in emr schema
SELECT 
    'Tables' as object_type,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'emr'
AND table_type = 'BASE TABLE'

UNION ALL

-- Sequences in emr schema
SELECT 
    'Sequences' as object_type,
    COUNT(*) as count
FROM information_schema.sequences 
WHERE sequence_schema = 'emr'

UNION ALL

-- Views in emr schema
SELECT 
    'Views' as object_type,
    COUNT(*) as count
FROM information_schema.views 
WHERE table_schema = 'emr'

UNION ALL

-- Functions in emr schema
SELECT 
    'Functions' as object_type,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'emr'
AND routine_type = 'FUNCTION';

-- Check public schema is empty (except system tables)
RAISE NOTICE '=== PUBLIC SCHEMA REMAINING CONTENTS ===';

SELECT 
    'Tables' as object_type,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
AND table_name NOT LIKE 'pg_%'

UNION ALL

SELECT 
    'Sequences' as object_type,
    COUNT(*) as count
FROM information_schema.sequences 
WHERE sequence_schema = 'public'

UNION ALL

SELECT 
    'Views' as object_type,
    COUNT(*) as count
FROM information_schema.views 
WHERE table_schema = 'public';

-- Detailed table listing in emr
RAISE NOTICE '=== DETAILED EMR TABLES ===';
SELECT 
    table_name,
    table_type,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'emr' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'emr'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Test data integrity
RAISE NOTICE '=== DATA INTEGRITY CHECK ===';
DO $$
DECLARE
    table_record RECORD;
    sql_statement TEXT;
    row_count BIGINT;
    total_rows BIGINT := 0;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'emr'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        sql_statement := format('SELECT COUNT(*) FROM emr.%I', table_record.table_name);
        EXECUTE sql_statement INTO row_count;
        
        total_rows := total_rows + row_count;
        RAISE NOTICE 'Table %: % rows', table_record.table_name, row_count;
    END LOOP;
    
    RAISE NOTICE 'Total rows in emr schema: %', total_rows;
END $$;

-- Test foreign key constraints
RAISE NOTICE '=== FOREIGN KEY CONSTRAINTS ===';
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'emr'
    AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, tc.constraint_name;

RAISE NOTICE '=== VERIFICATION COMPLETED ===';
RAISE NOTICE 'If all counts look correct and no errors occurred, migration is successful!';
RAISE NOTICE 'You can now proceed to create the consolidated dump for Supabase.';
