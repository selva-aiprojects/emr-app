import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function listAll() {
  try {
    console.log('Listing all tables in all schemas...');
    const res = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name;
    `);
    console.table(res.rows);

    console.log('\nChecking for "management" tables specifically...');
    const res2 = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_name LIKE '%management%'
      ORDER BY table_schema, table_name;
    `);
    console.table(res2.rows);

  } catch (err) {
    console.error('Error listing tables:', err.message);
  } finally {
    await pool.end();
  }
}

listAll();
