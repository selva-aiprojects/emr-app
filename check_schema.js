import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
  const res = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_schema = 'emr' AND table_name = 'patients' AND column_name = 'id'
  `);
  console.log('PATIENT ID TYPE:', res.rows[0].data_type);
  
  const migs = await pool.query('SELECT filename FROM emr.migrations_log ORDER BY id DESC LIMIT 5');
  console.log('LATEST MIGRATIONS:', migs.rows.map(r => r.filename));
  
  await pool.end();
}

checkSchema().catch(console.error);
