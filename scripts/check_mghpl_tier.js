import { query } from '../server/db/connection.js';

async function checkTier() {
  try {
    const res = await query("SELECT id, name, code, subscription_tier FROM emr.tenants WHERE code = 'MGHPL'");
    console.log('MGHPL Tenant Tier Info:');
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

checkTier();
