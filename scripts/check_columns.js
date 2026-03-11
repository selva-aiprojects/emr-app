
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    const client = await pool.connect();
    try {
        console.log('--- Checking prescriptions columns ---');
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'emr' AND table_name = 'prescriptions'
    `);
        console.log('Columns:', res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
    } catch (err) {
        console.error('❌ Check failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

check();
