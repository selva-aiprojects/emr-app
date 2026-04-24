import { query } from '../server/db/connection.js';

async function resetMigrations() {
  const failedFiles = [
    '002_finance_hr.sql',
    '003_insurance.sql',
    '004_feature_flags.sql',
    '005_fhir_compliance.sql',
    '006_pharmacy_module.sql',
    '007_support_tickets.sql',
    '008_infrastructure.sql',
    '009_roles_and_supervisors.sql',
    '010_additional_roles.sql',
    '011_product_gap_foundation.sql',
    '012_subscription_catalog.sql',
    '013_menu_system.sql'
  ];

  console.log('🔄 Resetting migration log for affected files...');
  
  try {
    for (const file of failedFiles) {
      await query('DELETE FROM emr.migrations_log WHERE filename = $1', [file]);
      console.log(`🗑️ Reset: ${file}`);
    }
    console.log('✅ Migration log reset. You can now run the debug script again.');
  } catch (err) {
    console.error('Reset failed:', err.message);
  } finally {
    process.exit(0);
  }
}

resetMigrations();
