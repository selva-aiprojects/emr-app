import { query } from '../server/db/connection.js';

async function checkUsers() {
  try {
    const tenantCode = 'MGHPL';
    const tenantRes = await query('SELECT id FROM emr.tenants WHERE code = $1', [tenantCode]);
    
    if (tenantRes.rowCount === 0) {
      console.log('Tenant not found');
      return;
    }
    
    const tenantId = tenantRes.rows[0].id;
    console.log(`Tenant ID for ${tenantCode}: ${tenantId}`);
    
    const usersRes = await query('SELECT email, role FROM emr.users WHERE tenant_id = $1', [tenantId]);
    console.log('Users for tenant:');
    console.table(usersRes.rows);
    
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkUsers();
