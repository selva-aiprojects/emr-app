
import { query } from './server/db/connection.js';

async function check() {
    try {
        const res = await query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'users'
        `);
        console.table(res.rows);
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        process.exit(0);
    }
}
check();
