import { query } from '../server/db/connection.js';

async function checkSchema() {
    try {
        console.log('Checking nexus.tenants schema...');
        const tenantsSchema = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'tenants'
        `);
        console.log('Nexus Tenants Columns:', tenantsSchema.rows);

        console.log('\nChecking management_tenants schema...');
        const mgmtSchema = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'management_tenants'
        `);
        console.log('Management Tenants Columns:', mgmtSchema.rows);

        const nahCheck = await query("SELECT id, code, name FROM management_tenants");
        console.log('\nAvailable Tenants in management_tenants:', nahCheck.rows);

        process.exit(0);
    } catch (err) {
        console.error('Schema check failed:', err);
        process.exit(1);
    }
}

checkSchema();
