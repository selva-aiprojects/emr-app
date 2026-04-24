import { query } from '../server/db/connection.js';

async function checkPrescriptionItems() {
    try {
        console.log('🔍 Checking prescription_items columns...');
        const items = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'emr' AND table_name = 'prescription_items';
        `);
        console.table(items.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkPrescriptionItems();
