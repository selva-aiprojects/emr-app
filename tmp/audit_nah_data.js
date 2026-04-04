
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const nahPatients = await pool.query('SELECT count(*) FROM nah.patients');
    console.log('nah.patients COUNT:', nahPatients.rows[0].count);

    const emrPatients = await pool.query('SELECT count(*) FROM emr.patients');
    console.log('emr.patients COUNT:', emrPatients.rows[0].count);

    const legacyNah = await pool.query("SELECT count(*) FROM pg_tables WHERE schemaname = 'tenant_nah' AND tablename = 'patients'");
    if (legacyNah.rows[0].count > 0) {
      const tenantNah = await pool.query('SELECT count(*) FROM tenant_nah.patients');
      console.log('tenant_nah.patients COUNT:', tenantNah.rows[0].count);
    } else {
      console.log('tenant_nah schema not found');
    }

    const ehsPatients = await pool.query('SELECT count(*) FROM ehs.patients');
    console.log('ehs.patients COUNT:', ehsPatients.rows[0].count);

    const users = await pool.query("SELECT email, name, role FROM emr.users WHERE tenant_id = 'f998a8f5-95b9-4fd7-a583-63cf574d65ed'");
    console.log('NAH USERS:');
    console.table(users.rows);

  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await pool.end();
  }
}
run();
