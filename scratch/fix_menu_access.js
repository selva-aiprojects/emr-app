import { query } from '../server/db/connection.js';

async function fixMenuAccess() {
    try {
        console.log('🚀 Force-enabling all menu items for the "admin" role...');
        
        // 1. Ensure all menu items have a record in role_menu_access for 'admin'
        await query(`
            INSERT INTO emr.role_menu_access (role_name, menu_item_id, is_visible)
            SELECT 'admin', id, true
            FROM emr.menu_item
            ON CONFLICT (role_name, menu_item_id) DO UPDATE SET is_visible = true
        `);
        
        // 2. Double check if any are still hidden
        const result = await query(`
            SELECT count(*) FROM emr.role_menu_access 
            WHERE role_name = 'admin' AND is_visible = true
        `);
        console.log(`✅ Admin now has access to ${result.rows[0].count} menu items.`);
        
    } catch (err) {
        console.error('❌ Update failed:', err.message);
    } finally {
        process.exit();
    }
}

fixMenuAccess();
