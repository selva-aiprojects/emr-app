import { query } from '../server/db/connection.js';

async function checkRoles() {
    try {
        console.log('🔍 Checking distinct roles in role_menu_access...');
        const res = await query("SELECT DISTINCT role_name FROM emr.role_menu_access");
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
    } finally {
        process.exit();
    }
}

checkRoles();
