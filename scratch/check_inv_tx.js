import { query } from '../server/db/connection.js';

async function checkInventoryTransactions() {
    try {
        const res = await query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'emr' AND table_name = 'inventory_transactions';
        `);
        console.log('Inventory Transactions Exist:', res.rows.length > 0);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkInventoryTransactions();
