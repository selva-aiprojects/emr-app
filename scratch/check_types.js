import { query } from '../server/db/connection.js';

async function checkTenantIdTypes() {
    try {
        console.log('🔍 Checking tenant_id types across tables...');
        const res = await query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'emr' 
            AND column_name IN ('tenant_id', 'id')
            AND table_name IN ('tenants', 'patients', 'users', 'appointments', 'encounters');
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkTenantIdTypes();
