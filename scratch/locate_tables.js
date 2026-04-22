import { query } from '../server/db/connection.js';

async function locateTables() {
    try {
        console.log('🔍 Listing tables in public and emr schemas...');
        const res = await query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema IN ('public', 'emr')
            ORDER BY table_schema, table_name
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

locateTables();
