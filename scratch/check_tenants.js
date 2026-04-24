import { query } from '../server/db/connection.js';

async function checkTenants() {
    try {
        console.log('🔍 Checking emr.tenants contents for NHGL...');
        const res = await query("SELECT id, code, subdomain, schema_name FROM emr.tenants WHERE code = 'NHGL' OR subdomain = 'nhgl'");
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkTenants();
