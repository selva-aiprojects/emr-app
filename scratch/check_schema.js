import { query } from '../server/db/connection.js';

async function checkSchema() {
    try {
        console.log('🔍 Checking if nhgl schema exists...');
        const res = await query("SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'nhgl'");
        console.log('Result:', res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkSchema();
