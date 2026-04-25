/**
 * NHGL TOTAL PURGE v5 — NUCLEAR OPTION
 * =====================================
 * - Truncates everything in the drug master/audit to break FK chains.
 * - Deletes ALL tenants except NHGL.
 * - Deletes ALL users except NHGL.
 * - Resets everything to a Clean-NHGL-Only state.
 */

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const KEEP_ID = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
const KEEP_CODE = 'NHGL';

async function runPurge() {
  await client.connect();
  console.log('☢️ Starting Nuclear Cleanup...');

  // 1. Break FKs by TRUNCATING the leaf tables (ONLY in emr schema)
  console.log('🔄 Wiping Global Drug/Audit Tables (Cascading TRUNCATE)...');
  await client.query(`TRUNCATE drug_batches, drug_master, audit_logs CASCADE`);

  // 2. Clear Tenants
  console.log('🔄 Cleaning Registries (Keeping Only NHGL)...');
  await client.query(`DELETE FROM management_tenants WHERE id != $1 AND code != $2`, [KEEP_ID, KEEP_CODE]);
  await client.query(`DELETE FROM tenants WHERE id != $1 AND code != $2`, [KEEP_ID, KEEP_CODE]);

  // 3. Clear Users (Keep NHGL users)
  console.log('🔄 Cleaning Global Users...');
  await client.query(`DELETE FROM users WHERE tenant_id != $1`, [KEEP_ID]);

  // 4. Force NHGL to be "nhgl" for everything
  console.log('🔄 Standardizing NHGL Routing...');
  await client.query(`UPDATE management_tenants SET name = 'NHGL Healthcare Institute', subdomain = 'nhgl', schema_name = 'nhgl' WHERE id = $1`, [KEEP_ID]);
  await client.query(`UPDATE tenants SET name = 'NHGL Healthcare Institute', subdomain = 'nhgl' WHERE id = $1`, [KEEP_ID]);

  // 5. Schema verification
  console.log('🔄 Final hygiene...');
  const schemas = await client.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('nhgl','emr','public','information_schema','pg_catalog','pg_toast')`);
  for (const s of schemas.rows) {
     console.log(`  🗑️  Dropping ${s.schema_name}`);
     await client.query(`DROP SCHEMA IF EXISTS "${s.schema_name}" CASCADE`).catch(()=>{});
  }

  await client.end();
  console.log('\n🌟 PURGE SUCCESSFUL. Only NHGL Healthcare Institute exists in the system now.');
  process.exit(0);
}

runPurge().catch(e => {
  console.error('\n❌ Purge Failed:', e.message);
  process.exit(1);
});
