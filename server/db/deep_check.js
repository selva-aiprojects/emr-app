import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function checkTenants() {
  try {
    const tenants = await pool.query('SELECT name, code, schema_name FROM emr.tenants');
    console.table(tenants.rows);

    for (const tenant of tenants.rows) {
        try {
            const res = await pool.query(`SELECT COUNT(*) FROM ${tenant.schema_name}.patients`);
            console.log(`Count in ${tenant.schema_name}.patients: ${res.rows[0].count}`);
        } catch (e) {
            console.error(`❌ Failed to query ${tenant.schema_name}.patients:`, e.message);
        }
    }
  } catch (err) {
    console.error('❌ Data check failed:', err.message);
  } finally {
    await pool.end();
  }
}

checkTenants();
