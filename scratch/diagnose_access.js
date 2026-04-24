import { query } from '../server/db/connection.js';

async function diagnoseAccess() {
    try {
        const tenantId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e'; // NHGL
        
        console.log('🔍 Diagnosing Feature Flags for NHGL...');
        const tenantRes = await query("SELECT features FROM emr.tenants WHERE id = $1", [tenantId]);
        console.log('NHGL Features:', JSON.stringify(tenantRes.rows[0]?.features, null, 2));

        console.log('\n🔍 Diagnosing Menu Access for role "admin"...');
        const menuRes = await query(`
            SELECT mi.code, mi.title, rma.is_visible 
            FROM emr.menu_item mi
            JOIN emr.role_menu_access rma ON mi.id = rma.menu_item_id
            WHERE rma.role_name = 'admin'
        `);
        console.table(menuRes.rows);

    } catch (err) {
        console.error('❌ Diagnosis failed:', err.message);
    } finally {
        process.exit();
    }
}

diagnoseAccess();
