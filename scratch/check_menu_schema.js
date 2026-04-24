import { query } from '../server/db/connection.js';

async function checkMenuSchema() {
    try {
        console.log('🔍 Inspecting emr.menu_item columns...');
        const res = await query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_schema = 'emr' AND table_name = 'menu_item'
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkMenuSchema();
