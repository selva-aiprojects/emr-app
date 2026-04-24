
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
        console.log('--- Checking emr schema tables ---');
        const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'emr'
    `);
        console.log('Tables in emr schema:', res.rows.map(r => r.table_name).join(', '));
    } catch (err) {
        console.error('❌ Check failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

check();
