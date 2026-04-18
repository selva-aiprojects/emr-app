import { query } from '../server/db/connection.js';

async function checkManagementTenant() {
  try {
    const res = await query("SELECT id, name, code, schema_name FROM emr.management_tenants WHERE name ILIKE '%Magnum Group%'");
    console.log('Management Tenant Mapping:');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkManagementTenant();
