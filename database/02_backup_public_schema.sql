-- =====================================================
-- STEP 2: BACKUP PUBLIC SCHEMA (SAFETY FIRST)
-- =====================================================
-- Create a complete backup before making changes

-- Create backup schema
CREATE SCHEMA IF NOT EXISTS public_backup;

-- Backup all tables with data
DO $$
DECLARE
    table_record RECORD;
    sql_statement TEXT;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        -- Create backup table
        sql_statement := format('CREATE TABLE IF NOT EXISTS public_backup.%I AS SELECT * FROM public.%I;', 
                               table_record.tablename, table_record.tablename);
        EXECUTE sql_statement;
        
        RAISE NOTICE 'Backed up table: %', table_record.tablename;
    END LOOP;
END $$;

-- Backup sequences
DO $$
DECLARE
    seq_record RECORD;
    sql_statement TEXT;
BEGIN
    FOR seq_record IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
        ORDER BY sequence_name
    LOOP
        -- Get current sequence value
        sql_statement := format('CREATE SEQUENCE IF NOT EXISTS public_backup.%I START WITH %L;', 
                               seq_record.sequence_name, 
                               (SELECT last_value FROM public."seq_record.sequence_name"));
        EXECUTE sql_statement;
        
        RAISE NOTICE 'Backed up sequence: %', seq_record.sequence_name;
    END LOOP;
END $$;

-- Create a complete dump file command (run separately)
-- pg_dump $DATABASE_URL --schema=public --no-owner --clean > public_schema_backup.sql

RAISE NOTICE '=== BACKUP COMPLETED ===';
RAISE NOTICE '1. Tables backed up to public_backup schema';
RAISE NOTICE '2. Run pg_dump command for file backup';
RAISE NOTICE '3. Verify backup before proceeding to migration';
