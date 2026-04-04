import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkLegacy() {
  try {
    console.log('Checking for legacy "emr.tenants" data...');
    const res = await pool.query('SELECT COUNT(*) FROM emr.tenants');
    console.log('Count in emr.tenants:', res.rows[0].count);

    console.log('Checking for new "management_tenants" data...');
    const res2 = await pool.query('SELECT COUNT(*) FROM management_tenants');
    console.log('Count in management_tenants:', res2.rows[0].count);

    if (res.rows[0].count > 0 && res2.rows[0].count == 0) {
        console.log('✅ Found legacy data but management_tenants is empty. You need to SYNC.');
    }
  } catch (err) {
    console.error('❌ Data check failed:', err.message);
    console.log('Trying without "emr." prefix...');
    try {
        const res3 = await pool.query('SELECT COUNT(*) FROM tenants');
        console.log('Count in tenants (no prefix):', res3.rows[0].count);
    } catch (e2) {
        console.error('❌ Still failed:', e2.message);
    }
  } finally {
    await pool.end();
  }
}

checkLegacy();
