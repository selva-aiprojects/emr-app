import { query } from '../server/db/connection.js';

async function verifyEHS() {
  console.log('🔍 Verifying EHS tenant and users...');
  
  // 1. Check EHS tenant
  const tenantRes = await query('SELECT id, name, code FROM emr.tenants WHERE code = $1', ['EHS']);
  console.log('\\n🏥 EHS Tenant:', tenantRes.rows[0] || 'NOT FOUND');
  if (tenantRes.rows.length === 0) {
    console.log('❌ EHS tenant missing!');
    process.exit(1);
  }
  const tenantId = tenantRes.rows[0].id;
  
  // 2. Check users count
  const userCount = await query('SELECT COUNT(*) FROM emr.users WHERE tenant_id::text = $1::text', [tenantId]);
  console.log('👥 Total EHS users:', userCount.rows[0].count);
  
  // 3. List key role users
  const keyUsers = await query(`
    SELECT email, name, role, is_active 
    FROM emr.users 
    WHERE tenant_id::text = $1::text AND role IN ('Admin', 'Doctor', 'Nurse', 'Lab', 'Pharmacy')
    ORDER BY role
  `, [tenantId]);
  console.log('\\n📋 Key EHS Users:');
  keyUsers.rows.forEach(u => {
    console.log(`  ${u.role.padEnd(12)}: ${u.email} (${u.is_active ? 'active' : 'inactive'})`);
  });
  
  // 4. Check password hash exists (non-empty)
  const pwCheck = await query('SELECT email, LENGTH(password_hash) as hash_len FROM emr.users WHERE tenant_id::text = $1::text LIMIT 3', [tenantId]);
  console.log('\\n🔐 Password Hash Check:');
  pwCheck.rows.forEach(u => console.log(`  ${u.email}: ${u.hash_len} chars`));
  
  console.log('\\n✅ Verification complete.');
}

verifyEHS().catch(console.error);
