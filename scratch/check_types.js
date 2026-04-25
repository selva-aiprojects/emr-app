
import { query } from './server/db/connection.js';

async function checkTypes() {
    try {
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'nexus' AND table_name = 'tenants' AND column_name = 'id'
        `);
        console.log('nexus.tenants.id type:', res.rows[0]);
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        process.exit(0);
    }
}
checkTypes();
