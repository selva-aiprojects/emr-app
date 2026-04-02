-- =====================================================
-- STEP 5: ROLLBACK SCRIPT (EMERGENCY ONLY)
-- =====================================================
-- Use this ONLY if migration fails and you need to restore

BEGIN;

-- Disable foreign key constraints temporarily
SET session_replication_role = replica;

-- Move everything back to public schema
DO $$
DECLARE
    table_record RECORD;
    sql_statement TEXT;
BEGIN
    RAISE NOTICE '=== ROLLING BACK TABLES ===';
    
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'emr'
        ORDER BY tablename
    LOOP
        -- Check if table already exists in public
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = table_record.tablename) THEN
            -- Move table back to public schema
            sql_statement := format('ALTER TABLE emr.%I SET SCHEMA public;', table_record.tablename);
            EXECUTE sql_statement;
            
            RAISE NOTICE 'Rolled back table: % -> public.%', table_record.tablename, table_record.tablename;
        ELSE
            RAISE NOTICE 'Table already exists in public: % (skipping rollback)', table_record.tablename;
        END IF;
    END LOOP;
END $$;

-- Move sequences back
DO $$
DECLARE
    seq_record RECORD;
    sql_statement TEXT;
BEGIN
    RAISE NOTICE '=== ROLLING BACK SEQUENCES ===';
    
    FOR seq_record IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'emr'
        ORDER BY sequence_name
    LOOP
        -- Check if sequence already exists in public
        IF NOT EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'public' AND sequence_name = seq_record.sequence_name) THEN
            -- Move sequence back to public schema
            sql_statement := format('ALTER SEQUENCE emr.%I SET SCHEMA public;', seq_record.sequence_name);
            EXECUTE sql_statement;
            
            RAISE NOTICE 'Rolled back sequence: % -> public.%', seq_record.sequence_name, seq_record.sequence_name;
        ELSE
            RAISE NOTICE 'Sequence already exists in public: % (skipping rollback)', seq_record.sequence_name;
        END IF;
    END LOOP;
END $$;

-- Restore from backup if needed (uncomment if you created backup schema)
/*
DO $$
DECLARE
    table_record RECORD;
    sql_statement TEXT;
BEGIN
    RAISE NOTICE '=== RESTORING FROM BACKUP ===';
    
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public_backup'
        ORDER BY tablename
    LOOP
        -- Drop existing table and restore from backup
        sql_statement := format('DROP TABLE IF EXISTS public.%I CASCADE;', table_record.tablename);
        EXECUTE sql_statement;
        
        sql_statement := format('CREATE TABLE public.%I AS SELECT * FROM public_backup.%I;', 
                               table_record.tablename, table_record.tablename);
        EXECUTE sql_statement;
        
        RAISE NOTICE 'Restored table: % from backup', table_record.tablename;
    END LOOP;
END $$;
*/

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Reset search_path
SET search_path TO public;

COMMIT;

RAISE NOTICE '=== ROLLBACK COMPLETED ===';
RAISE NOTICE 'All objects moved back to public schema';
RAISE NOTICE 'Verify data integrity before proceeding';
