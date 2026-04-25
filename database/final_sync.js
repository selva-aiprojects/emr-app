/**
 * NHGL FINAL ROUTING SYNC
 * ==========================
 * - Syncs management_tenants
 * - Syncs tenants
 * - Syncs users
 * - Ensures ALL point to ID 'b01f0cdc-4e8b-4db5-ba71-e657a414695e'
 * - Ensures the schema name is 'nhgl'
 */

import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const NHGL_ID = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
const ADMIN_EMAIL = 'admin@nhgl.local';

async function finalSync() {
  await client.connect();
  console.log('🔄 Performing Final Metadata Alignment...');

  // 1. Management Plane
  await client.query(`
    UPDATE management_tenants 
    SET schema_name = 'nhgl', 
        subdomain = 'nhgl',
        code = 'NHGL',
        name = 'NHGL Healthcare Institute',
        status = 'active'
    WHERE id = $1
  `, [NHGL_ID]);

  // 2. Legacy Tenants Table (For Routing Fallback)
  await client.query(`
    UPDATE tenants 
    SET code = 'NHGL', 
        name = 'NHGL Healthcare Institute',
        subdomain = 'nhgl'
    WHERE id = $1
  `, [NHGL_ID]);

  // 3. User Alignment
  await client.query(`
    UPDATE users 
    SET tenant_id = $1 
    WHERE email = $2 OR email = 'admin@nhgl.local'
  `, [NHGL_ID, ADMIN_EMAIL]);

  // 4. Verification Check
  const check = await client.query(`SELECT COUNT(*) FROM nhgl.patients`);
  console.log(`✅ Clinical Data Check: ${check.rows[0].count} patients found in nhgl schema.`);

  await client.end();
  console.log('\n🌟 METADATA LOCKED. Please LOGOUT and LOGIN to see changes.');
  process.exit(0);
}

finalSync().catch(e => {
  console.error('\n❌ Sync Failed:', e.message);
  process.exit(1);
});
