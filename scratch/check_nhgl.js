import { query } from '../server/db/connection.js';

async function checkNHGL() {
    try {
        console.log('🔍 Checking for NHGL tenant...');
        const res = await query("SELECT * FROM emr.tenants WHERE code ILIKE 'NHGL'");
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkNHGL();
