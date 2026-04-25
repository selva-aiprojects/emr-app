-- =====================================================
-- COMPREHENSIVE SCHEMA MIGRATION: PUBLIC -> NEXUS
-- =====================================================
-- Description: Copies all objects from public to nexus schema
-- using a non-destructive approach (no drops).
-- =====================================================

BEGIN;

-- 1. Create NEXUS schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS nexus;

-- 2. Move/Copy Custom Types
DO $$
DECLARE
    type_record RECORD;
BEGIN
    FOR type_record IN 
        SELECT n.nspname as schema_name, t.typname as type_name
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' 
        AND t.typtype = 'e' -- Enum types
    LOOP
        -- Unfortunately, there's no "CREATE TYPE LIKE"
        -- We would need to extract the definition.
        -- For now, we assume standard types or manual copy if needed.
        RAISE NOTICE 'Found custom enum type in public: %. Please ensure it is recreated in nexus if used.', type_record.type_name;
    END LOOP;
END $$;

-- 3. Copy Tables and Data
DO $$
DECLARE
    table_record RECORD;
    target_table TEXT;
    source_table TEXT;
    cols TEXT;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
        AND tablename NOT IN ('pg_stat_statements') -- Exclude system/extension tables
    LOOP
        source_table := 'public.' || quote_ident(table_record.tablename);
        target_table := 'nexus.' || quote_ident(table_record.tablename);
        
        -- Create table in nexus if not exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'nexus' AND table_name = table_record.tablename) THEN
            EXECUTE format('CREATE TABLE %s (LIKE %s INCLUDING ALL)', target_table, source_table);
            RAISE NOTICE 'Created table: % (Copied structure from public)', target_table;
        ELSE
            RAISE NOTICE 'Table % already exists in nexus. Attempting to merge data.', target_table;
        END IF;
        
        -- Copy data
        BEGIN
            EXECUTE format('INSERT INTO %s SELECT * FROM %s ON CONFLICT DO NOTHING', target_table, source_table);
            RAISE NOTICE 'Data copied to %', target_table;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not copy data for %: %', table_record.tablename, SQLERRM;
        END;
    END LOOP;
END $$;

-- 4. Copy Functions and Procedures
DO $$
DECLARE
    func_record RECORD;
    func_def TEXT;
BEGIN
    FOR func_record IN 
        SELECT 
            p.oid,
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_arguments(p.oid) as args,
            pg_get_functiondef(p.oid) as definition
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
    LOOP
        -- Replace 'public.' with 'nexus.' in the function definition body if it exists
        -- This is a bit risky but often necessary
        func_def := replace(func_record.definition, 'public.', 'nexus.');
        -- Also replace naming in the CREATE string
        func_def := replace(func_def, 'CREATE OR REPLACE FUNCTION public.' || func_record.function_name, 'CREATE OR REPLACE FUNCTION nexus.' || func_record.function_name);
        
        BEGIN
            EXECUTE func_def;
            RAISE NOTICE 'Copied function: nexus.%', func_record.function_name;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Could not copy function %: %', func_record.function_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 5. Copy Sequences (and sync values)
DO $$
DECLARE
    seq_record RECORD;
    current_val BIGINT;
BEGIN
    FOR seq_record IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'public'
    LOOP
        -- Create sequence in nexus if not exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'nexus' AND sequence_name = seq_record.sequence_name) THEN
            EXECUTE format('CREATE SEQUENCE nexus.%I', seq_record.sequence_name);
        END IF;
        
        -- Sync value
        EXECUTE format('SELECT last_value FROM public.%I', seq_record.sequence_name) INTO current_val;
        EXECUTE format('SELECT setval(''nexus.%I'', %L)', seq_record.sequence_name, current_val);
        
        RAISE NOTICE 'Synced sequence: nexus.% (value: %)', seq_record.sequence_name, current_val;
    END LOOP;
END $$;

-- 6. Update search_path for the database
-- Note: This needs to be run outside a transaction usually for global effect, 
-- but we provide the command here.
-- ALTER DATABASE postgres SET search_path TO nexus, public, extensions;

COMMIT;
