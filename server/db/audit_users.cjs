require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function audit() {
  const result = {};
  try {
    const res = await pool.query("SELECT id, email, tenant_id, role, password_hash FROM emr.users WHERE email LIKE 'admin@%'");
    result.users = res.rows;
    
    const res2 = await pool.query("SELECT id, name, code FROM emr.tenants");
    result.tenants = res2.rows;
    
    console.log('AUDIT_RESULT:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('AUDIT_FAILED:', err.message);
  } finally {
    await pool.end();
  }
}

audit();
