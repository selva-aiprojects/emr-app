import { query } from '../server/db/connection.js';

async function listMenuCodes() {
    try {
        console.log('🔍 Listing all registered Menu Item codes...');
        const res = await query("SELECT code, name FROM emr.menu_item ORDER BY code");
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

listMenuCodes();
