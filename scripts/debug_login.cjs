const { Pool } = require('pg');
require('dotenv').config({ path: '../server/.env' || '.env' });

async function debugLogin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔍 EMR Login Debug Tool');
    console.log('======================');

    // 1. List tenants
    console.log('\\n1. TENANTS:');
    const tenantsRes = await pool.query(`
      SELECT id, name, code FROM emr.management_tenants 
      UNION 
      SELECT id, name, code FROM emr.tenants 
      ORDER BY name
    `);
    console.table(tenantsRes.rows.slice(0,20));

    // 2. Common tenants user check
    const commonTenants = ['nhgl', 'ehs', 'smcmega', 'magnum', 'nhsl'];
    console.log('\\n2. ADMIN USERS for common tenants:');
    for (const code of commonTenants) {
      const tenantRes = await pool.query('SELECT id FROM emr.management_tenants WHERE UPPER(code) = UPPER($1)', [code]);
      const tenantId = tenantRes.rows[0]?.id;
      if (tenantId) {
        const userRes = await pool.query(`
          SELECT email, name, role, password_hash FROM emr.users 
          WHERE LOWER(email) LIKE 'admin@%' AND tenant_id::text = $1::text
        `, [tenantId]);
        console.log(`  ${code.toUpperCase()}:`, userRes.rows);
        if (userRes.rows[0]) {
          // Test hash (Admin@123)
          const bcrypt = require('bcryptjs');
          const isMatch = bcrypt.compareSync('Admin@123', userRes.rows[0].password_hash);
          console.log(`    Hash matches Admin@123? ${isMatch}`);
        }
      } else {
        console.log(`  ${code.toUpperCase()}: NO TENANT FOUND`);
      }
    }

    // 3. Superadmin
    console.log('\\n3. SUPERADMIN:');
    const superRes = await pool.query('SELECT email, password_hash FROM emr.users WHERE LOWER(email) = LOWER($1) AND tenant_id IS NULL', ['superadmin@emr.local']);
    console.table(superRes.rows);
    if (superRes.rows[0]) {
      const bcrypt = require('bcryptjs');
      const isMatch = bcrypt.compareSync('Admin@123', superRes.rows[0].password_hash);
      console.log(`  Superadmin hash matches? ${isMatch}`);
    }

    // 4. Recent logins fail count (if audit exists)
    console.log('\\n4. Recent failures (if audit_logs exist):');
    try {
      const auditRes = await pool.query(`
        SELECT action, details, created_at FROM emr.audit_logs 
        WHERE action LIKE '%login%' ORDER BY created_at DESC LIMIT 10
      `);
      console.table(auditRes.rows);
    } catch(e) {
      console.log('No audit_logs table or access');
    }

    console.log('\\n✅ Debug complete. Check above for missing users/hashes.');
  } catch (err) {
    console.error('❌ DB Error:', err.message);
  } finally {
    await pool.end();
  }
}

debugLogin();

