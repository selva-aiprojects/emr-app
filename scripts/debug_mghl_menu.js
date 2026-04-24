import { query, testConnection } from '../server/db/connection.js';

async function debugMGHL() {
  console.log('=== DEBUGGING MGHL TENANT ===');
  
  try {
    // Bootstrap DB
    console.log('🔄 Bootstrapping database connection and migrations...');
    await testConnection();
    
    // 0. Check available schemas
    const schemaList = await query("SELECT schema_name FROM information_schema.schemata");
    console.log('Available schemas:', schemaList.rows.map(s => s.schema_name).join(', '));
    const emrExists = schemaList.rows.some(s => s.schema_name === 'emr');
    if (!emrExists) {
      console.log('❌ Schema "emr" not found! This is likely the cause of the failures.');
      return;
    }

    // 1. Check if MGHPL exists
    const tenantRes = await query("SELECT * FROM emr.tenants WHERE code = 'MGHPL'");
    if (tenantRes.rows.length === 0) {
      console.log('❌ Tenant MGHPL not found in emr.tenants');
      const allTenants = await query("SELECT code, name FROM emr.tenants");
      console.log('Available tenants:', allTenants.rows.map(t => t.code).join(', '));
      return;
    }
    
    const tenant = tenantRes.rows[0];
    console.log(`✅ Tenant MGHPL found: ${tenant.name} (ID: ${tenant.id})`);
    console.log(`Tier: ${tenant.subscription_tier}, Status: ${tenant.status}`);
    
    // 2. Check if it's in management_tenants
    const mgmtRes = await query("SELECT * FROM emr.management_tenants WHERE code = 'MGHPL'");
    if (mgmtRes.rows.length === 0) {
      console.log('⚠️ Tenant MGHPL missing from emr.management_tenants. Syncing...');
      const schemaName = 'mgohl'; // Based on available schemas
      await query(`
        INSERT INTO emr.management_tenants (id, name, code, subdomain, schema_name, status, subscription_tier)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [tenant.id, tenant.name, tenant.code, tenant.subdomain || 'mghpl', schemaName, 'active', tenant.subscription_tier]);
      console.log('✅ Sync completed.');
    } else {
      console.log('✅ MGHPL found in management_tenants');
    }
    
    // 3. Check for menu items
    const menuItems = await query("SELECT count(*) FROM emr.menu_item");
    console.log(`Global menu items count: ${menuItems.rows[0].count}`);
    
    // 4. Check role access for MGHL
    const accessRes = await query(`
      SELECT role_name, count(*) 
      FROM emr.role_menu_access 
      WHERE tenant_id = $1 OR tenant_id IS NULL 
      GROUP BY role_name
    `, [tenant.id]);
    
    console.log('Role access counts:');
    accessRes.rows.forEach(r => console.log(`- ${r.role_name}: ${r.count} items`));
    
    // 5. If no specific access for MGHL, clone from global
    const mghlAccess = await query("SELECT count(*) FROM emr.role_menu_access WHERE tenant_id = $1", [tenant.id]);
    if (parseInt(mghlAccess.rows[0].count) === 0) {
      console.log('🚀 Cloning global menu access for MGHL...');
      await query(`
        INSERT INTO emr.role_menu_access (role_name, menu_item_id, is_visible, tenant_id)
        SELECT role_name, menu_item_id, is_visible, $1
        FROM emr.role_menu_access
        WHERE tenant_id IS NULL
        ON CONFLICT DO NOTHING
      `, [tenant.id]);
      console.log('✅ Menu access cloned.');
    }

  } catch (err) {
    console.error('Debug failed:');
    console.error(err);
  } finally {
    process.exit(0);
  }
}

debugMGHL();
