
import { query } from './server/db/connection.js';

async function checkNexus() {
    try {
        const res = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'nexus'
        `);
        console.log('Tables in nexus:', res.rows.map(r => r.table_name).join(', '));
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        process.exit(0);
    }
}
checkNexus();
