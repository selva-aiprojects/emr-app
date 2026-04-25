
import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function check() {
    try {
        const res = await pool.query(`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_name = 'service_requests'
        `);
        console.log('Schemas with service_requests:', res.rows.map(r => r.table_schema).join(', '));

        for (const row of res.rows) {
            console.log(`\nColumns in ${row.table_schema}.service_requests:`);
            const cols = await pool.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_schema = $1 AND table_name = 'service_requests'
            `, [row.table_schema]);
            console.table(cols.rows);
        }
    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        await pool.end();
    }
}
check();
