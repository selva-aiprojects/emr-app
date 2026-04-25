
import { query } from './server/db/connection.js';

async function updatePricing() {
    try {
        console.log('🚀 Updating Nexus Subscription Catalog...');
        
        // 1. Rename 'free' to 'basic' if it exists as 'free'
        await query(`
            UPDATE nexus.subscription_catalog 
            SET plan_id = 'basic_starter', name = 'Basic Starter', cost = '1999', color = 'blue',
                features = '["Up to 25 Users", "Full Clinical Flow", "Email Support"]'::jsonb
            WHERE plan_id = 'free'
        `);

        // 2. Update Professional
        await query(`
            UPDATE nexus.subscription_catalog 
            SET cost = '5999', color = 'indigo',
                features = '["Unlimited Users", "IPD & Bed Management", "24/7 Priority Support"]'::jsonb
            WHERE plan_id = 'professional'
        `);

        // 3. Update Enterprise
        await query(`
            UPDATE nexus.subscription_catalog 
            SET cost = '9999', color = 'emerald',
                features = '["AI Diagnosis Matrix", "Full HRMS & Payroll", "Dedicated Server Environment"]'::jsonb
            WHERE plan_id = 'enterprise'
        `);

        // 4. Clean up the old 'basic' if it's redundant now
        await query(`DELETE FROM nexus.subscription_catalog WHERE plan_id = 'basic'`);

        console.log('✅ Pricing updated successfully!');
    } catch (e) {
        console.error('Update failed:', e);
    } finally {
        process.exit(0);
    }
}
updatePricing();
