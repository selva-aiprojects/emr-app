import { query } from '../server/db/connection.js';

async function checkServiceRequests() {
    try {
        console.log('🔍 Checking service_requests columns...');
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'emr' AND table_name = 'service_requests';
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkServiceRequests();
