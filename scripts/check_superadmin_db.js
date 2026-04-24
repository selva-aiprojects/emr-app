import { query } from './server/db/connection.js';

async function checkSuperadmin() {
  try {
    const userResult = await query(
      `SELECT u.id, u.tenant_id, u.email, u.name, u.role, u.is_active 
       FROM emr.users u 
       WHERE u.email = 'superadmin@emr.local'`
    );
    
    console.log('Superadmin User Info:');
    console.table(userResult.rows);
    
    if (userResult.rows.length > 0) {
      const tenantId = userResult.rows[0].tenant_id;
      if (tenantId) {
        const tenantResult = await query(
          `SELECT id, name, status, subscription_tier FROM emr.tenants WHERE id = $1`,
          [tenantId]
        );
        console.log('Tenant Info (from emr.tenants):');
        console.table(tenantResult.rows);
        
        const mgmtTenantResult = await query(
          `SELECT id, name, status, subscription_tier FROM emr.management_tenants WHERE id = $1`,
          [tenantId]
        );
        console.log('Management Tenant Info (from emr.management_tenants):');
        console.table(mgmtTenantResult.rows);
      } else {
        console.log('User has NO tenant_id');
      }
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error checking superadmin:', err);
    process.exit(1);
  }
}

checkSuperadmin();
