
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
        console.log('--- Checking prescriptions statuses ---');
        const res = await client.query(`
      SELECT DISTINCT status FROM emr.prescriptions
    `);
        console.log('Statuses found:', res.rows.map(r => r.status));
    } catch (err) {
        console.error('❌ Check failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

check();
