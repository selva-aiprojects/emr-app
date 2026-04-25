
import { query } from './server/db/connection.js';

async function check() {
    try {
        console.log('--- Columns in service_requests ---');
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'service_requests'
        `);
        console.table(res.rows);
        
        console.log('--- Content of service_requests ---');
        const data = await query(`SELECT * FROM service_requests LIMIT 5`);
        console.table(data.rows);
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        process.exit(0);
    }
}
check();
