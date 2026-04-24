import { query } from '../server/db/connection.js';

async function checkPharmacy() {
    try {
        console.log('🔍 Checking Pharmacy items for NHGL...');
        const res = await query("SELECT count(*) FROM emr.inventory_items");
        console.log('Inventory Items count:', res.rows[0].count);
        
        const res2 = await query("SELECT count(*) FROM emr.pharmacy_inventory_enhanced");
        console.log('Enhanced Inventory count:', res2.rows[0].count);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkPharmacy();
