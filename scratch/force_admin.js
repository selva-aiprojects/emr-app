import { query, testConnection } from '../server/db/connection.js';
import bcrypt from 'bcryptjs';

async function forceAdmin() {
  const ok = await testConnection();
  if (!ok) {
    console.error('DB Connection Failed');
    return;
  }

  const email = 'superadmin@emr.local';
  const password = 'Admin@123';
  const hash = await bcrypt.hash(password, 10);

  console.log('Clearing existing superadmins...');
  await query("DELETE FROM nexus.users WHERE tenant_id IS NULL OR role = 'Superadmin'");

  console.log('Inserting superadmin...');
  await query(`
    INSERT INTO nexus.users (id, tenant_id, email, password_hash, name, role, is_active)
    VALUES (gen_random_uuid(), NULL, $1, $2, 'Master Superadmin', 'Superadmin', true)
  `, [email, hash]);

  console.log('Verifying insertion...');
  const res = await query('SELECT id, email, role, is_active FROM nexus.users WHERE email = $1', [email]);
  
  if (res.rows.length > 0) {
    console.log(`✅ VERIFIED! Superadmin created: ${res.rows[0].email} / ${password}`);
    console.log(`Database returned:`, res.rows[0]);
  } else {
    console.log(`❌ FAILURE: Inserted but could not be selected back! RLS or Transaction issue?`);
  }
  process.exit(0);
}

forceAdmin();
