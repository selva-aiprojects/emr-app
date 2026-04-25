import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function inspectSchema() {
  const client = await pool.connect();
  try {
    console.log('--- Inspecting nexus.users ---');
    const columns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'nexus' AND table_name = 'users'
    `);
    console.table(columns.rows);

    console.log('\n--- Inspecting nexus.management_tenants ---');
    const mtColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'nexus' AND table_name = 'management_tenants'
    `);
    console.table(mtColumns.rows);

  } catch (err) {
    console.error('Error inspecting schema:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

inspectSchema();
