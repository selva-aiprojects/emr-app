
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function verify() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
      SELECT COUNT(*) as count FROM emr.prescription_items
    `);
        console.log(`Prescription Items count: ${res.rows[0].count}`);

        const queueRes = await client.query(`
      SELECT p.id, p.prescription_number, pt.first_name, pi.status
      FROM emr.prescriptions p
      JOIN emr.patients pt ON p.patient_id = pt.id
      JOIN emr.prescription_items pi ON p.id = pi.prescription_id
      WHERE p.tenant_id = (SELECT id FROM emr.tenants WHERE code = 'EHS')
      LIMIT 10
    `);
        console.log('Sample Queue Data:', queueRes.rows);
    } catch (err) {
        console.error('❌ Verification failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

verify();
