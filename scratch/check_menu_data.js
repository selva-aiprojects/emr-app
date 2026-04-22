import { query } from '../server/db/connection.js';

async function checkMenuData() {
    try {
        console.log('🔍 Checking Menu Headers...');
        const headers = await query("SELECT count(*) FROM emr.menu_header");
        console.log('Headers count:', headers.rows[0].count);

        console.log('🔍 Checking Menu Items...');
        const items = await query("SELECT count(*) FROM emr.menu_item");
        console.log('Items count:', items.rows[0].count);

        if (headers.rows[0].count === '0') {
            console.log('⚠️ No menu headers found. Sidebar will be empty!');
        }
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkMenuData();
