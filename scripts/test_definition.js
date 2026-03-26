import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testDef() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
       SELECT column_name, data_type
       FROM information_schema.columns
       WHERE table_schema = 'emr' AND table_name = 'invoices'
    `);
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    client.release();
    await pool.end();
  }
}

testDef();
