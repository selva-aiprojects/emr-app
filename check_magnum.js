import { query } from './server/db/connection.js';

async function checkTenant() {
  try {
    console.log('Checking MAGNUM tenant...');

    const tenants = await query('SELECT id, name, code, subscription_tier FROM emr.tenants WHERE code = $1', ['MAGNUM']);
    console.log('Tenants:', tenants.rows);

    const mgmtTenants = await query('SELECT id, name, code, schema_name, subscription_tier FROM emr.management_tenants WHERE code = $1', ['MAGNUM']);
    console.log('Management Tenants:', mgmtTenants.rows);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkTenant();