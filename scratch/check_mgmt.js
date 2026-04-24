import { query } from '../server/db/connection.js';

async function checkManagementTenants() {
    try {
        console.log('🔍 Checking management_tenants contents...');
        const res = await query("SELECT id, code, subdomain, schema_name FROM emr.management_tenants");
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkManagementTenants();
