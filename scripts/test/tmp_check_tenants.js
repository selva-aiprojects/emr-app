import { query } from './server/db/connection.js';

async function check() {
  try {
    const res = await query('SELECT id, name, code, subscription_tier FROM emr.tenants ORDER BY name');
    console.log(JSON.stringify(res.rows, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
