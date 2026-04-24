
import pool from './server/db/connection.js';

async function checkOrphans() {
  console.log('--- Checking for Orphaned Tenants ---');
  try {
    const { rows: tenants } = await pool.query("SELECT id, name, code, schema_name FROM emr.management_tenants");
    for (const t of tenants) {
      const { rows: schemaCheck } = await pool.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`, [t.schema_name]);
      if (schemaCheck.length === 0) {
        console.log(`[ORPHAN] Tenant ${t.name} (${t.code}) has no schema ${t.schema_name}`);
        
        // Check if it has users in the shard
        console.log(`[ACTION] Purging orphaned registry entry for ${t.name}...`);
        await pool.query("DELETE FROM emr.management_tenants WHERE id::text = $1::text", [t.id]);
        console.log(`[SUCCESS] Purged ${t.name}`);
      } else {
        // Schema exists, check if tables exist
        const { rows: tableCheck } = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name = 'patients'`, [t.schema_name]);
        if (tableCheck.length === 0) {
           console.log(`[PARTIAL] Tenant ${t.name} has schema but NO clinical tables (patients missing).`);
           console.log(`[ACTION] Dropping broken schema ${t.schema_name} and purging registry...`);
           await pool.query(`DROP SCHEMA IF EXISTS "${t.schema_name}" CASCADE`);
           await pool.query("DELETE FROM emr.management_tenants WHERE id::text = $1::text", [t.id]);
           console.log(`[SUCCESS] Cleaned up broken tenant ${t.name}`);
        } else {
           console.log(`[OK] Tenant ${t.name} is fully initialized.`);
        }
      }
    }
  } catch (err) {
    console.error('Error during orphan check:', err.message);
  } finally {
    process.exit(0);
  }
}

checkOrphans();
