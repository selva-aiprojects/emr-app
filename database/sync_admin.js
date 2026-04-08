/**
 * NHGL ADMIN SYNC
 * =================
 * Fixes "0 dashboard data" by aligning the admin@nhgl.local 
 * user to the correct tenant ID used by the seeder.
 */

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const TARGET_ID = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
const ADMIN_EMAIL = 'admin@nhgl.local';

async function runSync() {
  await client.connect();
  console.log(`🔄 Syncing Admin (${ADMIN_EMAIL}) to seeded data (${TARGET_ID})...`);

  // 1. Check if user exists
  const checkRes = await client.query(`SELECT id, tenant_id FROM emr.users WHERE email = $1`, [ADMIN_EMAIL]);
  if (checkRes.rows.length === 0) {
    console.error('❌ Error: admin@nhgl.local not found in users table.');
    await client.end();
    return;
  }

  const oldId = checkRes.rows[0].tenant_id;
  if (oldId === TARGET_ID) {
    console.log('✅ Admin is already synced to the correct tenant ID.');
  } else {
    // 2. Perform the update
    await client.query(`UPDATE emr.users SET tenant_id = $1 WHERE email = $2`, [TARGET_ID, ADMIN_EMAIL]);
    console.log(`✅ Success! Redirected from ${oldId} to ${TARGET_ID}.`);
  }

  // 3. Make sure the tenant registry uses the matched name/code for the seeder
  await client.query(`UPDATE emr.management_tenants SET status = 'active' WHERE id = $1`, [TARGET_ID]);

  await client.end();
  console.log('\n🌟 Diagnostic Sync Complete. Please refresh your dashboard.');
  process.exit(0);
}

runSync().catch(e => {
  console.error('\n❌ Sync Failed:', e.message);
  process.exit(1);
});
