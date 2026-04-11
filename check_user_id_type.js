import pool from './server/db/connection.js';

async function check() {
  try {
    const res = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'emr' AND table_name = 'users' AND column_name = 'id'
    `);
    console.log('COLUMN TYPE:', JSON.stringify(res.rows));
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}
check();
