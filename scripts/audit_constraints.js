import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('--- AUDITING CONSTRAINTS FOR emr.tenants ---');
    const res = await pool.query(`
      SELECT
        conname AS constraint_name,
        relname AS table_name,
        pg_get_constraintdef(c.oid) AS definition
      FROM
        pg_constraint c
        JOIN pg_class r ON c.conrelid = r.oid
      WHERE
        contype = 'f'
        AND confrelid = (SELECT oid FROM pg_class WHERE relname = 'tenants' AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'emr'));
    `);
    
    console.log(JSON.stringify(res.rows, null, 2));
    
    // Also check for existing schemas
    const schemas = await pool.query("SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'");
    console.log('--- ALL SCHEMAS ---');
    console.log(JSON.stringify(schemas.rows.map(s => s.nspname), null, 2));

  } catch (err) {
    console.error('❌ Audit Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
