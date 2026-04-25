
import { query } from './server/db/connection.js';

async function check() {
    try {
        const res = await query("SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'nexus'");
        console.log('Tables in nexus:', res.rows.map(r => r.tablename));
        
        const menuHeader = await query("SELECT 1 FROM nexus.menu_header LIMIT 1").catch(e => ({ error: e.message }));
        console.log('nexus.menu_header status:', menuHeader.error ? 'Error: ' + menuHeader.error : 'Exists');

        const log = await query("SELECT filename FROM nexus.migrations_log ORDER BY executed_at DESC");
        console.log('Recent migrations:', log.rows.slice(0, 5));
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        process.exit(0);
    }
}
check();
