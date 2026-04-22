import { query } from '../server/db/connection.js';

async function checkExpenses() {
    try {
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'emr' AND table_name = 'expenses';
        `);
        console.log('Expenses Columns:', res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkExpenses();
