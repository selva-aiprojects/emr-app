import { query } from '../server/db/connection.js';

async function totalAccessFix() {
    try {
        const tenantId = 'b01f0cdc-4e8b-4db5-ba71-e657a414695e'; // NHGL
        
        console.log('🚀 Synchronizing NHGL for Total Access...');

        // 1. Ensure Tenant is set to 'Enterprise' with all features
        await query(`
            UPDATE emr.tenants 
            SET subscription_tier = 'Enterprise', 
                status = 'active',
                features = '{"inventory":true,"telehealth":true,"payroll":true,"staff_governance":true,"institutional_ledger":true,"billing":true,"emr":true}'
            WHERE id = $1
        `, [tenantId]);
        console.log('✅ Tenant subscription sync complete.');

        // 2. Wipe and re-insert menu access for 'admin' role
        await query("DELETE FROM emr.role_menu_access WHERE role_name = 'admin'");
        await query(`
            INSERT INTO emr.role_menu_access (role_name, menu_item_id, is_visible)
            SELECT 'admin', id, true FROM emr.menu_item
        `);
        console.log('✅ Admin role menu permissions re-initialized.');

        // 3. Ensure menu items themselves aren't locked to a different plan name
        // We'll update any that require a subscription to 'Enterprise' if they are set to something else
        await query(`
            UPDATE emr.menu_item 
            SET requires_subscription = false 
            WHERE code IN ('hospital_settings', 'staff_management', 'payroll_service', 'financial_ledger')
        `);
        console.log('✅ Core modules unlocked from subscription gates.');

    } catch (err) {
        console.error('❌ Sync failed:', err.message);
    } finally {
        process.exit();
    }
}

totalAccessFix();
