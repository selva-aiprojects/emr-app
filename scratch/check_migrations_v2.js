import { query } from '../server/db/connection.js';

async function checkMigrations() {
    try {
        console.log('🔍 Checking Applied Migrations...');
        const res = await query("SELECT filename, executed_at FROM emr.migrations_log ORDER BY executed_at DESC LIMIT 20");
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkMigrations();
