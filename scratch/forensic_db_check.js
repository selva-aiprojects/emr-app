import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function findTables() {
  const client = await pool.connect();
  try {
    console.log('🔍 Locating "users" and "roles" across ALL schemas...');
    const res = await client.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name IN ('users', 'roles', 'tenants')
      ORDER BY table_schema
    `);
    console.table(res.rows);

    const schemaRes = await client.query("SELECT nspname FROM pg_namespace WHERE nspname NOT LIKE 'pg_%' AND nspname != 'information_schema'");
    console.log('Available Schemas:', schemaRes.rows.map(r => r.nspname));

  } finally {
    client.release();
    await pool.end();
  }
}

findTables();
