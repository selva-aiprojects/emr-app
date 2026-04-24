import { query } from '../server/db/connection.js';

async function listTenants() {
  try {
    console.log('=== All Tenants with Code, Admin Email ===');
    const result = await query(`
      SELECT 
        mt.id, mt.name, mt.code, mt.schema_name,
        u.email as admin_email, u.role, u.is_active
FROM emr.management_tenants mt
LEFT JOIN emr.users u ON mt.id::text = u.tenant_id::text AND u.role = 'Admin' AND u.is_active = true
      ORDER BY mt.name
    `);
    result.rows.forEach(t => {
      console.log(`${t.name} (code: ${t.code}, schema: ${t.schema_name}) admin email: ${t.admin_email || 'MISSING - use admin@${t.code || t.schema_name}.com'}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listTenants();

