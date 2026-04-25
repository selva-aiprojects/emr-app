import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function inspect() {
  const client = await pool.connect();
  try {
    const tables = await client.query(`
      SELECT table_name, table_schema 
      FROM information_schema.tables 
      WHERE table_schema IN ('nexus', 'public') AND table_name LIKE '%tenant%'
    `);
    console.log('Tables:', tables.rows);

    const columns = await client.query(`
      SELECT table_name, column_name, data_type, character_maximum_length 
      FROM information_schema.columns 
      WHERE table_schema = 'nexus' AND table_name = 'management_tenants'
    `);
    console.log('Columns for management_tenants:', columns.rows);
    
    const constraints = await client.query(`
      SELECT conname, contype, pg_get_constraintdef(c.oid) as def
      FROM pg_constraint c
      JOIN pg_namespace n ON n.oid = c.connamespace
      WHERE n.nspname = 'nexus'
    `);
    console.log('Constraints in nexus:', constraints.rows);

  } finally {
    client.release();
    await pool.end();
  }
}

inspect();
