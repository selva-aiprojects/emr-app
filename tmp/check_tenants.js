import { query } from './server/db/connection.js';

async function check() {
  try {
    console.log('--- 🛡️  MANAGEMENT TENANTS ---');
    const tenants = await query('SELECT id, name, code, schema_name, created_at FROM emr.management_tenants ORDER BY created_at DESC LIMIT 5');
    console.table(tenants.rows);

    console.log('\n--- 📊  TENANT METRICS ---');
    const metrics = await query('SELECT tenant_id, tenant_code, doctors_count, patients_count FROM emr.management_tenant_metrics');
    console.table(metrics.rows);

    console.log('\n--- 🔍  SCHEMA DISCOVERY ---');
    const schemata = await query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog')");
    console.log('Total Schemata Found:', schemata.rowCount);
    console.log(schemata.rows.map(r => r.schema_name).join(', '));

  } catch (err) {
    console.error('Error during check:', err);
  } finally {
    process.exit(0);
  }
}

check();
