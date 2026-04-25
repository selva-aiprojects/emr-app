import { query } from '../server/db/connection.js';

async function listAllTenants() {
    try {
        console.log('--- PUBLIC.TENANTS ---');
        const res1 = await query("SELECT id, code, name FROM tenants");
        console.table(res1.rows);

        console.log('\n--- NEXUS.MANAGEMENT_TENANTS ---');
        // connection.js sets search_path to nexus, so we might need to be explicit if it's in a different schema
        const res2 = await query("SELECT id, code, name, schema_name FROM management_tenants");
        console.table(res2.rows);

        process.exit(0);
    } catch (err) {
        console.error('Lookup failed:', err.message);
        process.exit(1);
    }
}

listAllTenants();
