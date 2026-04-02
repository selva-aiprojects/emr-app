-- =====================================================
-- STEP 6: CREATE CONSOLIDATED DUMP FOR SUPABASE
-- =====================================================
-- Commands to run after successful migration

/*
=== OPTION 1: Using pg_dump command line ===
Run these commands in your terminal:

# Basic dump of emr schema only
pg_dump $DATABASE_URL --schema=emr --no-owner --clean --if-exists > emr_consolidated_dump.sql

# More comprehensive dump with data and structure
pg_dump $DATABASE_URL \
    --schema=emr \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --verbose \
    --disable-triggers \
    > emr_complete_for_supabase.sql

# Dump with specific formatting for Supabase
pg_dump $DATABASE_URL \
    --schema=emr \
    --no-owner \
    --no-privileges \
    --clean \
    --if-exists \
    --exclude-table-data='*_audit' \
    --exclude-table-data='*_logs' \
    --exclude-table-data='*_temp*' \
    > emr_production_ready.sql

=== OPTION 2: Using SQL to generate dump commands ===
*/

-- Generate appropriate pg_dump command based on your setup
SELECT 
    'EMR Schema Dump Command:' as command_type,
    format('pg_dump %s --schema=emr --no-owner --clean --if-exists > emr_consolidated_dump.sql', 
           current_setting('pg_settings.server_version_num')::int >= 120000 
           ? '--format=custom --compress=9' 
           : '--format=plain') as command

UNION ALL

SELECT 
    'Production Ready Command:' as command_type,
    format('pg_dump %s --schema=emr --no-owner --no-privileges --clean --if-exists --verbose > emr_for_supabase.sql', 
           current_setting('pg_settings.server_version_num')::int >= 120000 
           ? '--format=custom --compress=9' 
           : '--format=plain') as command

UNION ALL

SELECT 
    'Data-Only Command (if structure already exists):' as command_type,
    'pg_dump $DATABASE_URL --schema=emr --data-only --no-owner > emr_data_only.sql' as command;

/*
=== POST-DUMP VERIFICATION ===
After creating dump, verify it contains:

1. Schema creation: CREATE SCHEMA emr;
2. All tables: CREATE TABLE emr.table_name (...);
3. All data: INSERT INTO emr.table_name VALUES (...);
4. All constraints: FOREIGN KEY, CHECK, UNIQUE
5. All indexes: CREATE INDEX
6. All sequences: CREATE SEQUENCE
7. All functions: CREATE FUNCTION

=== SUPABASE IMPORT COMMANDS ===
Once you have the dump file:

# Using supabase CLI
supabase db reset --db-url=your-supabase-url
supabase db push emr_consolidated_dump.sql

# Using psql directly
psql $SUPABASE_DATABASE_URL -f emr_consolidated_dump.sql

# Using SQL editor in Supabase Dashboard
# Copy-paste the dump content into the SQL editor

=== CLEANUP AFTER IMPORT ===
-- Update search_path in Supabase
ALTER DATABASE postgres SET search_path TO emr, public;

-- Grant permissions if needed
GRANT USAGE ON SCHEMA emr TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA emr TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA emr TO postgres;
*/

-- Final verification query
SELECT 
    'Migration Ready for Supabase' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'emr' AND table_type = 'BASE TABLE') as table_count,
    (SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema = 'emr') as sequence_count,
    (SELECT COUNT(*) FROM information_schema.views WHERE table_schema = 'emr') as view_count,
    (SELECT COUNT(*) FROM information_schema.routines WHERE routine_schema = 'emr' AND routine_type = 'FUNCTION') as function_count;
