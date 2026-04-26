import pool from '../server/db/connection.js';

async function checkTenants() {
  try {
    const res = await pool.query('SELECT id, name, code, subdomain, status FROM nexus.tenants');
    console.log('--- NEXUS.TENANTS ---');
    console.table(res.rows);
    
    const res2 = await pool.query('SELECT id, name, code, subdomain, status FROM nexus.management_tenants');
    console.log('--- NEXUS.MANAGEMENT_TENANTS ---');
    console.table(res2.rows);
  } catch (err) {
    console.error('Error checking tenants:', err.message);
  } finally {
    process.exit();
  }
}

checkTenants();
