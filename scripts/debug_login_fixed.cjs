const { query } = require('../server/db/connection.js');
const bcrypt = require('bcryptjs');

async function debugLogin() {
  console.log('🔍 EMR Login Debug Tool (Fixed)');
  console.log('============================');

  try {
    // 1. List tenants
    console.log('\n1. TENANTS:');
    const tenantsRes = await query(`
      SELECT id, name, code FROM emr.management_tenants 
      UNION ALL
      SELECT id, name, code FROM emr.tenants 
      ORDER BY name
    `);
    console.table(tenantsRes.rows.slice(0,20));

    // 2. Common tenants user check
    const commonTenants = ['nhgl', 'ehs', 'smcmega', 'magnum', 'nhsl'];
    console.log('\n2. ADMIN USERS for common tenants:');
    for (const code of commonTenants) {
      const tenantRes = await query('SELECT id FROM emr.management_tenants WHERE UPPER(code) = UPPER($1)', [code]);
      const tenantId = tenantRes.rows[0]?.id;
      if (tenantId) {
        const userRes = await query(`
          SELECT email, name, role, password_hash FROM emr.users 
          WHERE LOWER(email) LIKE 'admin@%' AND tenant_id::text = $1::text
        `, [tenantId]);
        console.log(`  ${code.toUpperCase()}:`, userRes.rows);
        if (userRes.rows[0]) {
          const isMatch = bcrypt.compareSync('Admin@123', userRes.rows[0].password_hash);
          console.log(`    ✅ Password match: ${isMatch}`);
        } else {
          console.log(`    ❌ No admin user`);
        }
      } else {
        console.log(`  ${code.toUpperCase()}: ❌ No tenant`);
      }
    }

    // 3. Superadmin
    console.log('\n3. SUPERADMIN:');
    const superRes = await query('SELECT email, password_hash FROM emr.users WHERE LOWER(email) = LOWER($1) AND tenant_id IS NULL', ['superadmin@emr.local']);
    console.table(superRes.rows || []);
    if (superRes.rows[0]) {
      const isMatch = bcrypt.compareSync('Admin@123', superRes.rows[0].password_hash);
      console.log(`  Superadmin password match: ${isMatch}`);
    } else {
      console.log('  ❌ No superadmin');
    }

    // 4. Audit logs
    console.log('\n4. Recent login audits:');
    try {
      const auditRes = await query(`
        SELECT action, details, created_at FROM emr.audit_logs 
        WHERE action ILIKE '%login%' ORDER BY created_at DESC LIMIT 10
      `);
      console.table(auditRes.rows || []);
    } catch(e) {
      console.log('No audit_logs');
    }

    console.log('\n✅ Debug complete! If no users, run: node scripts/standardize_tenant_admins.cjs');
  } catch (err) {
    console.error('❌ ERROR:', err.message);
  }
}

debugLogin();
