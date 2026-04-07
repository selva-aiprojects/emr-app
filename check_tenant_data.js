import pool from './server/db/connection.js';

async function checkTenants() {
  console.log('--- Checking Management Tenants ---');
  try {
    const res = await pool.query('SELECT id, name, code, schema_name FROM emr.management_tenants');
    const tenants = res.rows;
    console.table(tenants);

    console.log('\n--- Checking counts for NAH and selected schemas ---');
    for (const t of tenants) {
      if (t.code === 'NAH' || t.code === 'EHS' || t.code === 'KCH') {
        console.log(`\nTenant: ${t.name} (${t.code}) / Schema: ${t.schema_name}`);
        const schema = t.schema_name;
        
        // Users (users are in emr.users filtered by tenant_id)
        const userRes = await pool.query('SELECT role, count(*) FROM emr.users WHERE tenant_id = $1 GROUP BY role', [t.id]);
        console.log(`Users in emr.users:`, userRes.rows);

        // check if schema exists
        const schemaExists = await pool.query(`SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`, [schema]);
        if (schemaExists.rows.length === 0) {
          console.log(`❌ SCHEMA ${schema} DOES NOT EXIST`);
          continue;
        }

        const tablesToCheck = ['patients', 'encounters', 'invoices'];
        for (const table of tablesToCheck) {
          try {
            const countRes = await pool.query(`SELECT count(*) FROM ${schema}.${table} WHERE tenant_id = $1`, [t.id]);
            console.log(`- ${table}: ${countRes.rows[0].count}`);
          } catch (e) {
            console.log(`- ${table}: Error checking - ${e.message}`);
          }
        }
      }
    }
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}

checkTenants();
