
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  try {
    const schemas = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')");
    console.log('Available schemas:', schemas.rows.map(r => r.schema_name));
    
    const tables = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast') ORDER BY table_schema, table_name");
    console.log('\nAvailable tables:');
    tables.rows.forEach(t => console.log('  ' + t.table_schema + '.' + t.table_name));
    
    // Check tenants specifically
    try {
      const tenants = await pool.query("SELECT COUNT(*) FROM nexus.tenants");
      console.log('\nNexus Tenants count:', tenants.rows[0].count);
    } catch (e) {
      console.log('\nError querying nexus.tenants:', e.message);
    }

    try {
      const mgmtTenants = await pool.query("SELECT COUNT(*) FROM nexus.management_tenants");
      console.log('Nexus Management Tenants count:', mgmtTenants.rows[0].count);
    } catch (e) {
      console.log('Error querying nexus.management_tenants:', e.message);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

run();
