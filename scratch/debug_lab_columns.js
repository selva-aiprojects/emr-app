
import { query } from './server/db/connection.js';

async function check() {
    try {
        console.log('--- service_requests tables across schemas ---');
        const res = await query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'service_requests'
        `);
        console.table(res.rows);

        for (const row of res.rows) {
            console.log(`--- Columns in ${row.table_schema}.service_requests ---`);
            const cols = await query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = $1 AND table_name = 'service_requests'
            `, [row.table_schema]);
            console.table(cols.rows);
        }
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        process.exit(0);
    }
}
check();
