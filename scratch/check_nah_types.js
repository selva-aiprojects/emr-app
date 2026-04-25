
import { query } from './server/db/connection.js';

async function checkTypes() {
    try {
        const res = await query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'nah' AND table_name IN ('patients', 'opd_tokens')
        `);
        console.table(res.rows);
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        process.exit(0);
    }
}
checkTypes();
