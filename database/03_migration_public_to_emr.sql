-- =====================================================
-- STEP 3: MIGRATE PUBLIC TO EMR SCHEMA
-- =====================================================
-- Main migration script - RUN WITH CAUTION

BEGIN;

-- Disable foreign key constraints temporarily
SET session_replication_role = replica;

-- Drop existing objects in emr if they conflict (optional)
-- Uncomment if you want to clean slate
-- DROP SCHEMA emr CASCADE;
-- CREATE SCHEMA emr;

-- Step 1: Move tables
DO $$
DECLARE
    table_record RECORD;
    sql_statement TEXT;
    table_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== MOVING TABLES ===';
    
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename
    LOOP
        -- Check if table already exists in emr
        sql_statement := format('SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = %L AND table_name = %L)', 
                               'emr', table_record.tablename);
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'emr' AND table_name = table_record.tablename) THEN
            -- Move table to emr schema
            sql_statement := format('ALTER TABLE public.%I SET SCHEMA emr;', table_record.tablename);
            EXECUTE sql_statement;
            
            table_count := table_count + 1;
            RAISE NOTICE 'Moved table: % -> emr.%', table_record.tablename, table_record.tablename;
        ELSE
            RAISE NOTICE 'Table already exists in emr: % (skipping)', table_record.tablename;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total tables moved: %', table_count;
END $$;

-- Step 2: Move sequences
DO $$
DECLARE
    seq_record RECORD;
    sql_statement TEXT;
    seq_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== MOVING SEQUENCES ===';
    
    FOR seq_record IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
        ORDER BY sequence_name
    LOOP
        -- Check if sequence already exists in emr
        IF NOT EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'emr' AND sequence_name = seq_record.sequence_name) THEN
            -- Move sequence to emr schema
            sql_statement := format('ALTER SEQUENCE public.%I SET SCHEMA emr;', seq_record.sequence_name);
            EXECUTE sql_statement;
            
            seq_count := seq_count + 1;
            RAISE NOTICE 'Moved sequence: % -> emr.%', seq_record.sequence_name, seq_record.sequence_name;
        ELSE
            RAISE NOTICE 'Sequence already exists in emr: % (skipping)', seq_record.sequence_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Total sequences moved: %', seq_count;
END $$;

-- Step 3: Move views
DO $$
DECLARE
    view_record RECORD;
    sql_statement TEXT;
    view_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== MOVING VIEWS ===';
    
    FOR view_record IN 
        SELECT table_name 
        FROM information_schema.views 
        WHERE table_schema = 'public'
        ORDER BY table_name
    LOOP
        -- Create view in emr schema
        sql_statement := format('CREATE OR REPLACE VIEW emr.%I AS %s;', 
                               view_record.table_name,
                               (SELECT view_definition FROM information_schema.views WHERE table_schema = 'public' AND table_name = view_record.table_name));
        EXECUTE sql_statement;
        
        -- Drop original view
        sql_statement := format('DROP VIEW public.%I;', view_record.table_name);
        EXECUTE sql_statement;
        
        view_count := view_count + 1;
        RAISE NOTICE 'Moved view: % -> emr.%', view_record.table_name, view_record.table_name;
    END LOOP;
    
    RAISE NOTICE 'Total views moved: %', view_count;
END $$;

-- Step 4: Update functions
DO $$
DECLARE
    func_record RECORD;
    sql_statement TEXT;
    func_count INTEGER := 0;
BEGIN
    RAISE NOTICE '=== MOVING FUNCTIONS ===';
    
    FOR func_record IN 
        SELECT 
            routine_name,
            routine_definition
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
        AND routine_type = 'FUNCTION'
        ORDER BY routine_name
    LOOP
        -- This is simplified - you may need to handle parameters
        sql_statement := format('CREATE OR REPLACE FUNCTION emr.%I() %s', 
                               func_record.routine_name,
                               func_record.routine_definition);
        EXECUTE sql_statement;
        
        -- Drop original function
        sql_statement := format('DROP FUNCTION public.%I();', func_record.routine_name);
        EXECUTE sql_statement;
        
        func_count := func_count + 1;
        RAISE NOTICE 'Moved function: %', func_record.routine_name;
    END LOOP;
    
    RAISE NOTICE 'Total functions moved: %', func_count;
END $$;

-- Re-enable foreign key constraints
SET session_replication_role = DEFAULT;

-- Step 5: Update search_path for current session
SET search_path TO emr, public;

COMMIT;

RAISE NOTICE '=== MIGRATION COMPLETED ===';
RAISE NOTICE '1. Tables moved to emr schema';
RAISE NOTICE '2. Sequences moved to emr schema';
RAISE NOTICE '3. Views moved to emr schema';
RAISE NOTICE '4. Functions moved to emr schema';
RAISE NOTICE '5. search_path updated';
RAISE NOTICE 'Run verification script next!';
