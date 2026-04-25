
import { query } from './server/db/connection.js';

async function checkNah() {
  try {
    const res = await query("SELECT id, name, code, subscription_tier FROM nexus.management_tenants WHERE code = 'nah'");
    console.log('NAH Tenant Data:', res.rows[0]);
  } catch (err) {
    console.error('Check failed:', err);
  } finally {
    process.exit(0);
  }
}

checkNah();
