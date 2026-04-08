/**
 * Cleanup all tenants except NHGL
 * NOTE: DROP SCHEMA runs outside transactions (DDL auto-commit)
 */
import pool from '../server/db/connection.js';

const KEEP_TENANT_ID = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e';
const KEEP_SCHEMA = 'nhgl';

async function sq(client, sql, params = []) {
  try {
    return await client.query(sql, params);
  } catch(e) {
    console.warn(`  ⚠️  ${e.message.substring(0, 120)}`);
    return { rowCount: 0, rows: [] };
  }
}

async function cleanup() {
  console.log('🧹 Starting tenant cleanup — keeping NHGL only...\n');

  const client = await pool.connect();
  try {
    // Get all tenants to remove
    const res = await client.query(
      `SELECT id, name, code, schema_name FROM emr.management_tenants WHERE id != $1`,
      [KEEP_TENANT_ID]
    );
    console.log(`Found ${res.rows.length} tenant(s) to remove:`);
    res.rows.forEach(t => console.log(`  - ${t.name} (${t.code}) → schema: ${t.schema_name}`));
    console.log('');

    for (const t of res.rows) {
      const schema = t.schema_name;
      console.log(`Processing: ${t.name} (${t.code})`);

      // 1. Drop schema — must be OUTSIDE a transaction block
      if (schema && schema !== 'emr' && schema !== 'public' && schema !== KEEP_SCHEMA) {
        await sq(client, `DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        console.log(`  ✅ Dropped schema: ${schema}`);
      }

      // 2. Remove users
      const ur = await sq(client, `DELETE FROM emr.users WHERE tenant_id = $1`, [t.id]);
      console.log(`  ✅ Removed ${ur.rowCount} users`);

      // 3. Remove from emr.tenants
      await sq(client, `DELETE FROM emr.tenants WHERE id = $1`, [t.id]);

      // 4. Remove from emr.management_tenants
      await sq(client, `DELETE FROM emr.management_tenants WHERE id = $1`, [t.id]);
      console.log(`  ✅ Registry cleared`);
    }

    console.log('\n✅ Cleanup complete. Remaining tenants:');
    const remaining = await client.query(
      `SELECT name, code, schema_name, status FROM emr.management_tenants ORDER BY name`
    );
    remaining.rows.forEach(r =>
      console.log(`  🏥 ${r.name} (${r.code}) | Schema: ${r.schema_name} | ${r.status}`)
    );

    process.exit(0);
  } catch(err) {
    console.error('❌ Cleanup failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

cleanup();
