
import { query } from './server/db/connection.js';

async function checkMenuItems() {
    try {
        console.log('--- Checking Missing Menu Items ---');
        const res = await query(`
            SELECT mi.name, mi.code, mi.requires_subscription, mi.subscription_plans, h.name as header
            FROM nexus.menu_item mi
            JOIN nexus.menu_header h ON mi.header_id = h.id
            WHERE mi.code IN ('feature_flags', 'system_settings', 'settings', 'admin_settings')
               OR mi.name ILIKE '%setting%' OR mi.name ILIKE '%flag%'
        `);
        console.table(res.rows);

        console.log('\n--- Checking Role Access for Admin ---');
        const access = await query(`
            SELECT mi.name, rma.role_name, rma.is_visible
            FROM nexus.role_menu_access rma
            JOIN nexus.menu_item mi ON rma.menu_item_id = mi.id
            WHERE LOWER(rma.role_name) = 'admin'
              AND mi.code IN ('feature_flags', 'system_settings', 'settings', 'admin_settings')
        `);
        console.table(access.rows);

    } catch (e) {
        console.error('Check failed:', e);
    } finally {
        process.exit(0);
    }
}
checkMenuItems();
