import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  console.log('🔍 [INTERNAL_DIAGNOSTIC] Checking schema health...');
  try {
    const schemas = await pool.query("SELECT schema_name FROM information_schema.schemata");
    console.log('✅ Found schemas:', schemas.rows.map(r => r.schema_name).filter(s => !s.startsWith('pg_')));

    const tables = await pool.query("SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('emr', 'public')");
    console.log('✅ Found tables:', tables.rows);

    const tenants = await pool.query("SELECT count(*) FROM emr.tenants");
    console.log('✅ Legacy Tenants count:', tenants.rows[0].count);

    const mgmtTenants = await pool.query("SELECT count(*) FROM emr.management_tenants");
    console.log('✅ Management Tenants count:', mgmtTenants.rows[0].count);

  } catch (err) {
    console.error('❌ [DIAGNOSTIC_FAILURE]:', err.message);
  } finally {
    await pool.end();
  }
}

check();
