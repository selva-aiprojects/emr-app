/**
 * NHGL FINAL INSPECTOR
 * =====================
 * - Logs all registry entries exactly as the DB sees them.
 * - Helps identify which ID the UI is actually using.
 */

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function inspect() {
  await client.connect();
  console.log('🔍 Database Inspection starting...\n');

  console.log('--- emr.management_tenants ---');
  const mRes = await client.query(`SELECT id, name, code, subdomain, schema_name FROM emr.management_tenants`);
  console.table(mRes.rows);

  console.log('\n--- emr.tenants ---');
  const tRes = await client.query(`SELECT id, name, code, subdomain FROM emr.tenants`);
  console.table(tRes.rows);

  console.log('\n--- User Tenant Association ---');
  const uRes = await client.query(`SELECT email, tenant_id FROM emr.users WHERE email = 'admin@nhgl.local'`);
  console.table(uRes.rows);

  await client.end();
  process.exit(0);
}

inspect().catch(e => {
  console.error('\n❌ Inspect Failed:', e.message);
  process.exit(1);
});
