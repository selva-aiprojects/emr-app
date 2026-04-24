import { query } from '../server/db/connection.js';

async function checkMigrationSchema() {
    try {
        console.log('🔍 Inspecting emr.migrations_log columns...');
        const res = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'emr' AND table_name = 'migrations_log'
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkMigrationSchema();
