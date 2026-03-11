
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
        console.log('--- Checking prescriptions constraints with names ---');
        const res = await client.query(`
      SELECT conname, pg_get_constraintdef(oid) as def
      FROM pg_constraint 
      WHERE conrelid = 'emr.prescriptions'::regclass AND contype = 'c'
    `);
        res.rows.forEach(r => console.log(`${r.conname}: ${r.def}`));
    } catch (err) {
        console.error('❌ Check failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

check();
