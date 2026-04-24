import { query } from '../server/db/connection.js';

async function checkInventory() {
    try {
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'emr' AND table_name = 'inventory_items';
        `);
        console.log('Inventory Columns:', res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkInventory();
