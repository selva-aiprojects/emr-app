import { query } from '../server/db/connection.js';

async function checkMigrations() {
    try {
        console.log('🔍 Checking Applied Migrations...');
        const res = await query("SELECT migration_name, applied_at FROM emr.migrations_log ORDER BY applied_at DESC LIMIT 20");
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkMigrations();
