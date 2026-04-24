/**
 * QUICK FIX: Set MGHPL schema_name to 'mgohl'
 * Run: node scratch/list_tenants.js
 */
import pool from '../server/db/connection.js';

async function main() {
  // Find MGHPL
  const { rows: tenants } = await pool.query(
    `SELECT id, name, code, subscription_tier FROM emr.tenants 
     WHERE code ILIKE '%mghpl%' OR name ILIKE '%magnum%'`
  );
  console.log('MGHPL tenant:', tenants);

  if (!tenants.length) { console.error('Not found!'); await pool.end(); return; }
  const { id, name, code } = tenants[0];

  // Verify mgohl schema exists and has patients table
  const { rows: check } = await pool.query(
    `SELECT table_name FROM information_schema.tables 
     WHERE table_schema = 'mgohl' ORDER BY table_name`
  );
  console.log(`\nmgohl schema tables (${check.length}):`, check.map(r => r.table_name).join(', '));

  // Count key data
  const counts = {};
  for (const t of ['patients', 'appointments', 'departments', 'beds', 'employees', 'encounters', 'invoices']) {
    try {
      const r = await pool.query(`SELECT COUNT(*)::int as c FROM mgohl.${t}`);
      counts[t] = r.rows[0].c;
    } catch { counts[t] = 'N/A'; }
  }
  console.log('\nData in mgohl schema:', counts);

  // Fix schema_name in management_tenants
  await pool.query(
    `UPDATE emr.management_tenants 
     SET schema_name = 'mgohl', subscription_tier = 'Enterprise', updated_at = NOW()
     WHERE id::text = $1::text`,
    [id]
  );
  console.log('\n✅ management_tenants.schema_name → mgohl');

  // Fix emr.tenants subscription tier
  await pool.query(
    `UPDATE emr.tenants SET subscription_tier = 'Enterprise' WHERE id::text = $1::text`,
    [id]
  );
  console.log('✅ emr.tenants subscription_tier → Enterprise');

  // Verify
  const { rows: final } = await pool.query(
    `SELECT t.name, t.code, t.subscription_tier, mt.schema_name 
     FROM emr.tenants t 
     JOIN emr.management_tenants mt ON t.id::text = mt.id::text 
     WHERE t.id::text = $1::text`,
    [id]
  );
  console.log('\nFinal state:'); console.table(final);

  console.log('\n🎉 All fixed! Now:');
  console.log('   1. The server needs to restart to clear the schema cache.');
  console.log('   2. Hard-refresh your browser (Ctrl+Shift+R)');
  console.log('   3. Log in as MGHPL admin — dashboard should load from mgohl schema');

  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); });
