import { query } from '../server/db/connection.js';

async function debugData() {
    try {
        console.log('--- Debugging Data ---');
        const tenants = await query('SELECT * FROM emr.tenants');
        console.log('Tenants:', tenants.rows.map(t => ({ id: t.id, code: t.code, name: t.name })));

        const users = await query(`
            SELECT id, email, role, tenant_id, is_active 
            FROM emr.users 
            WHERE email IN ('support@ehs.local', 'ops@ehs.local')
        `);
        console.log('Target Users:', users.rows);

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

debugData();
