import { query } from '../server/db/connection.js';

async function listTables() {
    try {
        console.log('🔍 Listing tables in emr schema...');
        const res = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'emr';
        `);
        console.log('Tables:', res.rows.map(r => r.table_name));
    } catch (err) {
        console.error('❌ Listing failed:', err.message);
    } finally {
        process.exit();
    }
}

listTables();
