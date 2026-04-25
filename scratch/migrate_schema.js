
import { query } from './server/db/connection.js';

async function rename() {
  try {
    // 1. Create nexus schema if it doesn't exist
    await query(`CREATE SCHEMA IF NOT EXISTS nexus;`);
    console.log('✅ Schema nexus created or already exists.');

    // 2. Rename emr to nexus if emr exists
    const schemaCheck = await query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'emr';`);
    if (schemaCheck.rows.length > 0) {
      // Postgres doesn't allow renaming a schema if a schema with the new name already exists.
      // So if 'nexus' exists, we might need to move tables.
      // But 'emr' is our current one.
      
      // I'll try to rename. If 'nexus' exists, I'll drop 'nexus' first (if it's empty).
      // Actually, safest is to just try renaming.
      try {
        await query(`ALTER SCHEMA emr RENAME TO nexus_old_${Date.now()};`); // Avoid conflict
      } catch (e) {
        console.warn('Could not rename emr to temporary name:', e.message);
      }
    }
    
    // Actually, a better approach:
    // If emr exists, rename it to nexus. If nexus already exists, this will fail.
    // Let's check if nexus exists.
    const nexusCheck = await query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'nexus';`);
    if (nexusCheck.rows.length > 0) {
       console.log('⚠️ nexus schema already exists. Checking if emr exists...');
       const emrCheck = await query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'emr';`);
       if (emrCheck.rows.length > 0) {
          console.log('🔄 Both exist. Moving tables from emr to nexus...');
          const tables = await query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'emr';`);
          for (const table of tables.rows) {
             await query(`ALTER TABLE emr.${table.table_name} SET SCHEMA nexus;`);
             console.log(`   ✅ Moved table ${table.table_name}`);
          }
       }
    } else {
       const emrCheck = await query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'emr';`);
       if (emrCheck.rows.length > 0) {
          await query(`ALTER SCHEMA emr RENAME TO nexus;`);
          console.log('✅ Renamed emr schema to nexus.');
       }
    }

  } catch (err) {
    console.error('❌ Schema transition failed:', err);
  } finally {
    process.exit();
  }
}

rename();
