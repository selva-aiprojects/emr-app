import { query } from '../server/db/connection.js';

async function checkConstraints() {
    try {
        console.log('🔍 Checking constraints on management_tenants...');
        const res = await query(`
            SELECT conname, pg_get_constraintdef(c.oid) 
            FROM pg_constraint c 
            JOIN pg_class t ON c.conrelid = t.oid 
            WHERE t.relname = 'management_tenants'
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkConstraints();
