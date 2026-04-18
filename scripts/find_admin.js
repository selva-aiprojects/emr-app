import { query } from '../server/db/connection.js';

async function findAdmin() {
  try {
    console.log('🔍 Searching for MGHPL Admin...');
    
    // 1. Get tenant ID
    const tenantRes = await query("SELECT id FROM emr.tenants WHERE code = 'MGHPL'");
    if (tenantRes.rowCount === 0) {
      console.log('❌ Tenant MGHPL not found');
      return;
    }
    const tenantId = tenantRes.rows[0].id;
    
    // 2. Get Admin users
    const userRes = await query("SELECT email, name, role FROM emr.users WHERE tenant_id = $1 AND (role ILIKE '%admin%' OR role ILIKE '%superadmin%')", [tenantId]);
    
    if (userRes.rowCount === 0) {
      console.log('❌ No admin user found for MGHPL in emr.users');
      // List all users for this tenant just in case
      const allUsers = await query("SELECT email, name, role FROM emr.users WHERE tenant_id = $1", [tenantId]);
      console.log('All users for MGHPL:');
      console.table(allUsers.rows);
    } else {
      console.log('✅ Found MGHPL Admin(s):');
      console.table(userRes.rows);
    }

  } catch (err) {
    console.error('Query failed:', err.message);
  } finally {
    process.exit(0);
  }
}

findAdmin();
