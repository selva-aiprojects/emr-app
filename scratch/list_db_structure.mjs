
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
    console.log('Listing all schemas:');
    const schemas = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema', 'pg_catalog')");
    console.log(schemas.rows.map(r => r.schema_name));

    for (const schema of schemas.rows.map(r => r.schema_name)) {
      console.log(`\nTables in schema: ${schema}`);
      const tables = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = $1", [schema]);
      console.log(tables.rows.map(r => r.table_name));
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

run();
