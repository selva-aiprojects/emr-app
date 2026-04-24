import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseDir = path.join(__dirname, '../database');
const obsoleteDir = path.join(databaseDir, 'obsolete');

if (!fs.existsSync(obsoleteDir)) {
    fs.mkdirSync(obsoleteDir);
    console.log(`Created directory: ${obsoleteDir}`);
}

const filesToMove = [
    '01_discover_public_tables.sql',
    '02_backup_public_schema.sql',
    '03_migration_public_to_emr.sql',
    '03_migration_public_to_emr_v2.sql',
    '04_verify_migration.sql',
    '05_rollback_migration.sql',
    '06_create_consolidated_dump.sql',
    'ADD_MISSING_CORE_TABLES.sql',
    'CONSOLIDATED_EMR_INSTALL.sql',
    'EMR_COMPLETE_FINAL_DUMP_FIXED.sql',
    'EMR_COMPLETE_FIXED_DUMP.sql',
    'MAGNUM_MISSING_TABLES.sql',
    'MAGNUM_SCHEMA_SETUP.sql',
    'MINIMAL_WORKING_DATABASE.sql',
    'TEST_BASIC_TABLES.sql',
    'analyze_public_schema_usage.sql',
    'application_test_suite.sql',
    'billing_insurance_extensions.sql',
    'check_actual_database_state.sql',
    'complete_migration_workflow.sql',
    'enhanced_insurance_schema.sql',
    'enhanced_pharmacy_schema.sql',
    'fix_institutional_branding.sql',
    'incremental_migration_plan.sql',
    'init_db.sql',
    'init_quick.sql',
    'migrate_next_table.sql',
    'schema.sql',
    'schema_enhanced.sql',
    'start_first_migration.sql',
    'supabase_admin_settings_schema.sql',
    'supabase_complete_emr_schema.sql',
    'supabase_complete_setup.sql',
    'supabase_emr_schema_setup.sql',
    'supabase_emr_seed_data.sql',
    'supabase_seed_data.sql',
    'tenant_base_schema.sql',
    'tenant_base_schema_comprehensive.sql',
    'tenant_base_schema_comprehensive_v2.sql',
    'tenant_base_schema_fixed.sql',
    'test_after_migration.sql',
    'test_menu_system.sql'
];

filesToMove.forEach(file => {
    const oldPath = path.join(databaseDir, file);
    const newPath = path.join(obsoleteDir, file);
    
    if (fs.existsSync(oldPath)) {
        try {
            fs.renameSync(oldPath, newPath);
            console.log(`Moved: ${file} -> obsolete/`);
        } catch (err) {
            console.error(`Failed to move ${file}: ${err.message}`);
        }
    } else {
        console.warn(`File not found: ${file}`);
    }
});

console.log('\n✅ Cleanup complete!');
