/**
 * NHGL DASHBOARD DIAGNOSTIC
 * ===========================
 * - Checks which schema the app SHOULD be using.
 * - Counts patients in that schema.
 * - Verifies the login user belongs to that tenant.
 */

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runDiag() {
  await client.connect();
  console.log('🔍 Running Dashboard Diagnostic...');

  // 1. Check management record
  const mRes = await client.query(`SELECT id, name, code, schema_name, subdomain FROM management_tenants`);
  console.log('\n--- Management Tenants (Registry) ---');
  console.table(mRes.rows);

  // 2. Check patients in NHGL schema
  console.log('\n--- Checking Clinical Data (nhgl schema) ---');
  try {
    const pRes = await client.query(`SELECT count(*) FROM nhgl.patients`);
    const eRes = await client.query(`SELECT count(*) FROM nhgl.encounters`);
    console.log(`✅ Patients found in nhgl: ${pRes.rows[0].count}`);
    console.log(`✅ Encounters found in nhgl: ${eRes.rows[0].count}`);
  } catch (e) {
    console.warn(`❌ "nhgl" schema access failed: ${e.message}`);
  }

  // 3. Check current users
  console.log('\n--- Current Users (users) ---');
  const uRes = await client.query(`SELECT id, name, email, role, tenant_id FROM users LIMIT 5`);
  console.table(uRes.rows);

  await client.end();
}

runDiag().catch(e => {
  console.error('\n❌ Diag Failed:', e.message);
  process.exit(1);
});
