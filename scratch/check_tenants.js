import { query } from './server/db/connection.js';

async function checkTenants() {
  try {
    const t = await query('SELECT * FROM nexus.tenants');
    console.log('--- nexus.tenants ---');
    console.table(t.rows);

    const m = await query('SELECT * FROM nexus.management_tenants');
    console.log('\n--- nexus.management_tenants ---');
    console.table(m.rows);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkTenants();
