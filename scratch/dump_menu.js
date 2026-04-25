
import { query } from './server/db/connection.js';
import fs from 'fs';

async function check() {
    try {
        const res = await query(`
            SELECT mi.id, mi.name, mi.code, mi.requires_subscription, mi.subscription_plans, h.name as header
            FROM nexus.menu_item mi
            JOIN nexus.menu_header h ON mi.header_id = h.id
            ORDER BY h.sort_order, mi.sort_order
        `);
        
        const access = await query(`
            SELECT mi.code, rma.role_name, rma.is_visible
            FROM nexus.role_menu_access rma
            JOIN nexus.menu_item mi ON rma.menu_item_id = mi.id
        `);

        fs.writeFileSync('scratch/menu_dump.json', JSON.stringify({ items: res.rows, access: access.rows }, null, 2));
    } catch (e) {
        fs.writeFileSync('scratch/menu_dump.json', JSON.stringify({ error: e.message }));
    } finally {
        process.exit(0);
    }
}
check();
